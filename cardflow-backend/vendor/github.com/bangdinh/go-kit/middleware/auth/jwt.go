package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	stderrors "errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
)

var errSessionRevoked = stderrors.New("session revoked")

// Handler is the JWT auth middleware. Construct with New().
type Handler struct {
	cfg         Config
	cache       *jwksCache
	redisClient redis.UniversalClient
}

// Option configures Handler.
type Option func(*Handler)

// WithRedisClient enables session blacklist checks via Redis.
func WithRedisClient(client redis.UniversalClient) Option {
	return func(h *Handler) { h.redisClient = client }
}

// WithHTTPClient overrides the HTTP client used for JWKS/OIDC fetching (useful in tests).
func WithHTTPClient(client *http.Client) Option {
	return func(h *Handler) { h.cache.httpClient = client }
}

// New returns an Echo middleware that validates JWT Bearer tokens.
//
// The middleware performs steps in order:
//  1. Bearer token extraction
//  2. Issuer allowlist check (no crypto)
//  3. Cryptographic verification via JWKS (auto-fetched on first use, auto-refreshed on key rotation)
//  4. Audience check
//  5. Optional tenant ID check
//  6. Optional session blacklist check via Redis
//
// On success the middleware stores parsed claims and metadata in the Echo context
// under the ContextKey* constants.
func New(cfg Config, opts ...Option) echo.MiddlewareFunc {
	h := &Handler{
		cfg:   cfg,
		cache: newJWKSCache(cfg, &http.Client{Timeout: cfg.jwksFetchTimeout()}),
	}
	for _, o := range opts {
		o(h)
	}
	return h.middleware
}

func (h *Handler) middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Step 1 — bearer token
		tokenString, err := extractBearerToken(c)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
		}

		// Step 2 — issuer allowlist (no crypto)
		issuer, err := extractPayloadIssuer(tokenString)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid token format")
		}
		if !h.isAllowedIssuer(issuer) {
			return echo.NewHTTPError(http.StatusUnauthorized, "untrusted issuer")
		}

		kid, err := extractHeaderKid(tokenString)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid token format")
		}

		// Step 3 — cryptographic verification
		authCtx, cancel := context.WithTimeout(c.Request().Context(), h.cfg.authTimeout())
		defer cancel()

		key, err := h.resolveKey(authCtx, issuer, kid)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "unable to verify token")
		}

		claims := &Claims{}
		_, err = jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return key, nil
		})
		if err != nil {
			if stderrors.Is(err, jwt.ErrTokenExpired) {
				return echo.NewHTTPError(http.StatusUnauthorized, "Token expired")
			}
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
		}

		// Step 4 — audience check
		if !h.cfg.KeycloakAudienceAllowAll && !h.checkAudience(claims, issuer) {
			return echo.NewHTTPError(http.StatusForbidden, "Forbidden: audience mismatch")
		}

		// Step 5 — tenant ID check (VerifyTenantIDInToken)
		if h.cfg.VerifyTenantIDInToken {
			if err := h.checkTenantID(c, claims); err != nil {
				return err
			}
		}

		// Step 6 — session blacklist
		if h.redisClient != nil && claims.SID != "" {
			realm := extractRealm(issuer)
			if err := h.checkBlacklist(authCtx, realm, claims.SID); err != nil {
				if stderrors.Is(err, errSessionRevoked) {
					return echo.NewHTTPError(http.StatusUnauthorized, "Session has been revoked")
				}
				if !h.cfg.BlacklistFailOpen {
					return echo.NewHTTPError(http.StatusUnauthorized, "session validation failed")
				}
			}
		}

		// Success — populate context
		realm := extractRealm(issuer)
		c.Set(ContextKeyIssuer, issuer)
		c.Set(ContextKeyRealm, realm)
		c.Set(ContextKeyClaims, claims)
		if claims.TenantAccess != nil {
			c.Set(ContextKeyTenantAccess, claims.TenantAccess)
		}

		return next(c)
	}
}

// resolveKey returns the cached RSA public key, refreshing JWKS once on cache miss.
func (h *Handler) resolveKey(ctx context.Context, issuer, kid string) (*rsa.PublicKey, error) {
	key, err := h.cache.GetKey(issuer, kid)
	if err == nil {
		return key, nil
	}
	// Cache miss (first request or key rotation) — refresh once.
	if err := h.cache.Refresh(ctx, issuer); err != nil {
		return nil, fmt.Errorf("refreshing JWKS: %w", err)
	}
	return h.cache.GetKey(issuer, kid)
}

func (h *Handler) isAllowedIssuer(issuer string) bool {
	if h.cfg.KeycloakHost != "" && strings.HasPrefix(issuer, h.cfg.KeycloakHost+"/realms/") {
		return h.realmAllowed(issuer, h.cfg.AllowedRealms)
	}
	if h.cfg.SecondaryIssuer != "" && issuer == h.cfg.SecondaryIssuer {
		return true
	}
	return false
}

// realmAllowed returns true if allowedRealms is empty (any realm) or the realm
// extracted from issuer appears in the list.
func (h *Handler) realmAllowed(issuer string, allowedRealms []string) bool {
	if len(allowedRealms) == 0 {
		return true
	}
	realm := extractRealm(issuer)
	for _, r := range allowedRealms {
		if r == realm {
			return true
		}
	}
	return false
}

func (h *Handler) checkAudience(claims *Claims, issuer string) bool {
	if h.cfg.KeycloakAudienceAllowAll {
		return true
	}
	allowed := map[string]struct{}{"account": {}}
	for _, a := range h.cfg.KeycloakAudience {
		allowed[a] = struct{}{}
	}
	if issuer == h.cfg.SecondaryIssuer {
		for _, a := range h.cfg.SecondaryAudience {
			allowed[a] = struct{}{}
		}
	}
	candidates := []string(claims.Audience)
	if claims.AZP != "" {
		candidates = append(candidates, claims.AZP)
	}
	for _, candidate := range candidates {
		if _, ok := allowed[candidate]; ok {
			return true
		}
	}
	return false
}

func (h *Handler) checkTenantID(c echo.Context, claims *Claims) error {
	headerTenantID := c.Request().Header.Get("X-Tenant-Id")
	if headerTenantID == "" {
		return nil // header absent → skip check
	}
	if claims.TenantAccess == nil {
		return echo.NewHTTPError(http.StatusForbidden, "Forbidden: tenant not found in token")
	}
	if claims.TenantAccess.TenantID != headerTenantID {
		return echo.NewHTTPError(http.StatusForbidden, "Forbidden: tenant mismatch")
	}
	return nil
}

func (h *Handler) checkBlacklist(ctx context.Context, realm, sid string) error {
	// Secondary issuer tokens have no realm segment; the blacklist namespace only applies
	// to Keycloak realm sessions, so skip the check entirely for the secondary issuer.
	if realm == "" {
		return nil
	}
	key := fmt.Sprintf("auth:blacklist:%s:%s", realm, sid)
	exists, err := h.redisClient.Exists(ctx, key).Result()
	if err != nil {
		return err
	}
	if exists > 0 {
		return errSessionRevoked
	}
	return nil
}

// --- helpers ---

func extractBearerToken(c echo.Context) (string, error) {
	header := c.Request().Header.Get("Authorization")
	if header == "" {
		return "", fmt.Errorf("missing Authorization header")
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", fmt.Errorf("invalid Authorization header format")
	}
	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", fmt.Errorf("missing bearer token")
	}
	return token, nil
}

func extractPayloadIssuer(tokenString string) (string, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid JWT format")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("decoding JWT payload: %w", err)
	}
	var p struct {
		Issuer string `json:"iss"`
	}
	if err := json.Unmarshal(payload, &p); err != nil {
		return "", fmt.Errorf("parsing JWT payload: %w", err)
	}
	return p.Issuer, nil
}

func extractHeaderKid(tokenString string) (string, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid JWT format")
	}
	header, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("decoding JWT header: %w", err)
	}
	var h struct {
		Kid string `json:"kid"`
	}
	if err := json.Unmarshal(header, &h); err != nil {
		return "", fmt.Errorf("parsing JWT header: %w", err)
	}
	return h.Kid, nil
}

func extractRealm(issuer string) string {
	const seg = "/realms/"
	idx := strings.Index(issuer, seg)
	if idx < 0 {
		return ""
	}
	rest := issuer[idx+len(seg):]
	if i := strings.Index(rest, "/"); i >= 0 {
		return rest[:i]
	}
	return rest
}
