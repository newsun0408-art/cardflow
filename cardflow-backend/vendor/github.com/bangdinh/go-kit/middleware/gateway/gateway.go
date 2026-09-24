// Package gateway is the trust boundary for a service sitting behind Kong with
// the BRM `brm-authz` plugin.
//
// After Kong allows a request it strips `Authorization` and sets three headers
// (kong-plugin/docs/kong-convention.md §7, handler.lua:360-367):
//
//	X-Gateway-Token   shared secret proving the request came through Kong
//	X-User-Id         the caller's Keycloak `sub`
//	X-Tenant-Id       the caller's `company_code` (e.g. "fli") — NOT a UUID
//
// There is no JWT left to verify, so identity IS those headers. Two of them are
// plain strings anyone can type; only X-Gateway-Token separates "came through
// Kong" from "dialled the pod directly". kong-convention.md §11 states services
// will also have their own ingress, so the direct path is expected to exist.
//
// What the token buys, and what it does not: it stops any workload on the
// network from impersonating any user. It does NOT stop someone who can read
// one request from replaying it forever — the secret is static and travels in
// cleartext. The real fix is mTLS/SPIFFE and belongs to Platform.
//
// Usage — mount on business routes only; /healthz, /readyz and /metrics do not
// go through Kong:
//
//	gw, err := gateway.New(cfg.Gateway)
//	if err != nil {
//	    logger.Fatal("gateway middleware", zap.Error(err))
//	}
//	handler.RegisterRoutes(e, gw)
//
// Do NOT mount auth.New alongside it on the same routes. Kong's
// `strip_authorization` is a plugin flag (schema.lua:50), not a constant —
// whoever creates the plugin instance can turn it off, and nothing checks. A
// service with no code path that reads Authorization is unaffected either way.
package gateway

import (
	"crypto/sha256"
	"crypto/subtle"
	"fmt"
	"strings"

	apperrors "github.com/bangdinh/go-kit/errors"
	"github.com/bangdinh/go-kit/middleware/header"
	"github.com/labstack/echo/v4"
)

// Default header names. They match the plugin's own defaults
// (schema.lua: user_header, gateway_token_header) — override via Config only if
// the Kong side was changed too.
const (
	HeaderGatewayToken = "X-Gateway-Token"
	HeaderUserID       = header.HeaderUserID
	HeaderTenantID     = header.HeaderTenantID
)

// Config is read from the global config under `gateway`.
type Config struct {
	// Tokens are the accepted X-Gateway-Token values. At least one non-blank
	// value is required — New refuses to build otherwise.
	//
	// A LIST, not a single value, so the secret can be rotated in two steps
	// (accept old+new, switch Kong, drop old) instead of a hard cutover. With a
	// single value every rotation is an outage, which in practice means nobody
	// ever rotates.
	//
	// Keep the VALUE out of config.json — but the `gateway.tokens` KEY must be
	// present there (an empty list is enough). Viper's AutomaticEnv only resolves
	// keys it already knows, so with no key at all GATEWAY_TOKENS is dropped in
	// silence and Tokens arrives nil (measured 2026-09-17). The env value is split
	// on "," by the loader's StringToSliceHookFunc (config/loader.go:180-184).
	Tokens []string `mapstructure:"tokens"`

	TokenHeader  string `mapstructure:"token_header"`
	UserHeader   string `mapstructure:"user_header"`
	TenantHeader string `mapstructure:"tenant_header"`
}

func (c *Config) defaults() {
	if c.TokenHeader == "" {
		c.TokenHeader = HeaderGatewayToken
	}
	if c.UserHeader == "" {
		c.UserHeader = HeaderUserID
	}
	if c.TenantHeader == "" {
		c.TenantHeader = HeaderTenantID
	}
}

// New returns the middleware, or an error if no usable token is configured.
//
// Failing here — at wire time — is deliberate: a misconfiguration must kill the
// process on startup, visible in the pod's first log lines, not wave traffic
// through once the service is already serving. The alternative, degrading to
// "allow" when the gate cannot be built, is the shape of bug that reads as
// working software: the operator sees a running pod and assumes it is guarded.
func New(cfg Config) (echo.MiddlewareFunc, error) {
	cfg.defaults()

	digests := make([][32]byte, 0, len(cfg.Tokens))
	for _, t := range cfg.Tokens {
		// A blank entry would match a request that sends no token header at
		// all: the gate looks configured and is wide open.
		if strings.TrimSpace(t) == "" {
			continue
		}
		digests = append(digests, sha256.Sum256([]byte(t)))
	}
	if len(digests) == 0 {
		return nil, fmt.Errorf("gateway: no token configured in %q — refusing to build a gate that admits everyone", "gateway.tokens")
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()

			if !tokenMatches(digests, req.Header.Get(cfg.TokenHeader)) {
				return reject()
			}

			// Kong sets all three together. A valid token with a missing
			// identity means either the request did not come from Kong, or the
			// plugin is misconfigured — neither is a request to serve.
			id := Identity{
				UserID:   req.Header.Get(cfg.UserHeader),
				TenantID: req.Header.Get(cfg.TenantHeader),
			}
			if id.UserID == "" || id.TenantID == "" {
				return reject()
			}

			c.Set(contextKeyIdentity, id)

			// Also publish through the core channel for VERIFIED identity.
			// idempotency's default ScopeFn reads it (binding an
			// Idempotency-Key to its caller), and it is what gets propagated
			// to downstream gRPC calls. Skipping this leaves the scope empty,
			// and two tenants then share one idempotency key.
			ctx := header.SetIdentity(req.Context(), id.TenantID, id.UserID, "")
			c.SetRequest(req.WithContext(ctx))

			return next(c)
		}
	}, nil
}

// reject returns the SAME error for every failure. Saying "token ok but user
// header missing" tells a caller they guessed the secret correctly, turning the
// gate into an oracle for probing it.
func reject() error {
	return apperrors.Unauthorized("request did not arrive through the gateway")
}

func tokenMatches(digests [][32]byte, presented string) bool {
	if presented == "" {
		return false
	}
	// Hash both sides first so the comparison is constant-time regardless of
	// length; comparing the raw strings would leak the secret's length.
	got := sha256.Sum256([]byte(presented))
	ok := false
	for _, want := range digests {
		// No early return — keep the work independent of which entry matched.
		if subtle.ConstantTimeCompare(got[:], want[:]) == 1 {
			ok = true
		}
	}
	return ok
}
