package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"

	apperrors "github.com/bangdinh/go-kit/errors"
)

const pdpBatchSize = 10

// PDPChecker calls the Policy Decision Point service to authorize requests.
// Construct with NewPDPChecker().
type PDPChecker struct {
	cfg        Config
	httpClient *http.Client
}

// PDPOption configures a PDPChecker.
type PDPOption func(*PDPChecker)

// WithPDPHTTPClient overrides the HTTP client used to call the PDP service (useful in tests).
func WithPDPHTTPClient(client *http.Client) PDPOption {
	return func(p *PDPChecker) { p.httpClient = client }
}

// NewPDPChecker creates a PDPChecker. It evaluates bypass tiers, in order, before
// calling the PDP service (see docs/authz_sequence.html):
//  1. Local JWT permissions (external_device_check=true + permissions claim) — a fast
//     path that resolves allow/deny locally and skips every other tier, even if the
//     token also carries a platform-admin or privileged role.
//  2. Platform admin (realm_access.roles ∩ PlatformAdminRoles) — always bypasses,
//     any tenant.
//  3. Privileged client (resource_access[PrivilegedClientID].roles ∩ PrivilegedRoles).
//     When cfg.VerifyTenantIDInToken is false, this bypasses unconditionally (today's
//     behavior, unchanged). When true, it additionally requires tenant_access.tenant_id
//     in the token to match the X-Tenant-Id header; a mismatch or missing
//     tenant_access/header does not deny the request — it falls through to a real PDP
//     call instead.
func NewPDPChecker(cfg Config, opts ...PDPOption) *PDPChecker {
	p := &PDPChecker{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
	for _, o := range opts {
		o(p)
	}
	return p
}

// Check verifies that the authenticated principal is authorized for the current request.
// Requires the JWT middleware to have run first (populates auth.Claims in context).
// Returns *apperrors.AppError (Unauthorized or Forbidden) on denial, nil on success.
func (p *PDPChecker) Check(c echo.Context) error {
	claims := GetClaims(c)
	if claims == nil {
		return apperrors.Unauthorized("not authenticated")
	}

	// Tier 1 (fast path): external device uses local JWT permissions. Takes
	// priority over every other tier, even platform-admin/privileged-client roles.
	if claims.ExternalDevice {
		return p.checkLocalPermissions(c, claims)
	}

	// Tier 2 bypass: platform admin — always bypasses, any tenant.
	if p.isPlatformAdmin(claims) {
		return nil
	}

	// Tier 3 bypass: privileged client.
	if p.isPrivilegedUser(claims) {
		if !p.cfg.VerifyTenantIDInToken {
			return nil // today's behavior, unchanged
		}
		if p.isSameTenant(c, claims) {
			return nil
		}
		// Tenant mismatch or missing tenant_access/header — not a denial, just no
		// bypass; fall through to a real PDP call below.
	}

	return p.callPDP(c)
}

// Middleware wraps Check as an Echo middleware, converting AppError → HTTPError.
func (p *PDPChecker) Middleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if err := p.Check(c); err != nil {
				return err // *AppError -> jsonErrorHandler -> RFC 9457 ProblemDetail (preserves Code)
			}
			return next(c)
		}
	}
}

func (p *PDPChecker) isPlatformAdmin(claims *Claims) bool {
	for _, adminRole := range p.cfg.PlatformAdminRoles {
		for _, r := range claims.RealmAccess.Roles {
			if r == adminRole {
				return true
			}
		}
	}
	return false
}

func (p *PDPChecker) isPrivilegedUser(claims *Claims) bool {
	if p.cfg.PrivilegedClientID == "" || len(p.cfg.PrivilegedRoles) == 0 {
		return false
	}
	access, ok := claims.ResourceAccess[p.cfg.PrivilegedClientID]
	if !ok {
		return false
	}
	privileged := make(map[string]struct{}, len(p.cfg.PrivilegedRoles))
	for _, r := range p.cfg.PrivilegedRoles {
		privileged[r] = struct{}{}
	}
	for _, r := range access.Roles {
		if _, ok := privileged[r]; ok {
			return true
		}
	}
	return false
}

// isSameTenant reports whether the token's tenant_access.tenant_id matches the
// X-Tenant-Id request header. A missing header or missing tenant_access claim is
// treated as "not the same tenant" — this only gates the privileged-client bypass,
// it does not deny the request; the caller falls through to a real PDP call instead.
func (p *PDPChecker) isSameTenant(c echo.Context, claims *Claims) bool {
	headerTenantID := c.Request().Header.Get("X-Tenant-Id")
	if headerTenantID == "" {
		return false
	}
	if claims.TenantAccess == nil {
		return false
	}
	return claims.TenantAccess.TenantID == headerTenantID
}

func (p *PDPChecker) checkLocalPermissions(c echo.Context, claims *Claims) error {
	required := c.Request().Header.Get("X-Feature")
	if required == "" {
		return apperrors.Forbidden("missing required permission header")
	}
	for _, perm := range claims.Permissions {
		if perm == required {
			return nil
		}
	}
	return apperrors.Forbidden("insufficient permissions")
}

func (p *PDPChecker) callPDP(c echo.Context) error {
	objectIDsHeader := c.Request().Header.Get("X-Object-Ids")
	if objectIDsHeader == "" {
		return p.callPDPOnce(c.Request().Context(), c, nil)
	}

	parts := strings.Split(objectIDsHeader, ",")
	ids := parts[:0]
	for _, s := range parts {
		s = strings.TrimSpace(s)
		if s != "" {
			ids = append(ids, s)
		}
	}

	if len(ids) == 0 {
		return p.callPDPOnce(c.Request().Context(), c, nil)
	}

	if len(ids) <= pdpBatchSize {
		return p.callPDPOnce(c.Request().Context(), c, ids)
	}

	chunks := chunkStrings(ids, pdpBatchSize)
	return p.callPDPParallel(c.Request().Context(), c, chunks)
}

func (p *PDPChecker) callPDPOnce(ctx context.Context, c echo.Context, objectIDs []string) error {
	url := p.cfg.PDPBaseURL + p.cfg.pdpPath()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return apperrors.InternalErrorWrap("building PDP request", err)
	}

	req.Header.Set("Authorization", c.Request().Header.Get("Authorization"))

	for key, values := range c.Request().Header {
		if strings.HasPrefix(strings.ToUpper(key), "X-") {
			for _, v := range values {
				req.Header.Add(key, v)
			}
		}
	}

	if len(objectIDs) > 0 {
		req.Header.Set("X-Object-Ids", strings.Join(objectIDs, ","))
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return apperrors.ServiceUnavailable("PDP service unreachable")
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusUnauthorized:
		return apperrors.Unauthorized("Unauthorized")
	case http.StatusForbidden:
		return apperrors.Forbidden("Forbidden")
	default:
		return apperrors.ServiceUnavailable(fmt.Sprintf("PDP error: status %d", resp.StatusCode))
	}
}

func (p *PDPChecker) callPDPParallel(ctx context.Context, c echo.Context, chunks [][]string) error {
	type result struct{ err error }

	chs := make([]chan result, len(chunks))
	for i := range chs {
		chs[i] = make(chan result, 1)
	}

	var wg sync.WaitGroup
	for i, chunk := range chunks {
		wg.Add(1)
		go func(ch chan result, ids []string) {
			defer wg.Done()
			ch <- result{err: p.callPDPOnce(ctx, c, ids)}
		}(chs[i], chunk)
	}
	wg.Wait()

	for _, ch := range chs {
		if r := <-ch; r.err != nil {
			return r.err
		}
	}
	return nil
}

func chunkStrings(s []string, size int) [][]string {
	var chunks [][]string
	for len(s) > 0 {
		n := size
		if len(s) < n {
			n = len(s)
		}
		chunks = append(chunks, s[:n])
		s = s[n:]
	}
	return chunks
}
