package auth

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// TokenAuthConfig configures the TokenAuth middleware.
type TokenAuthConfig struct {
	// Header is the request header to read the token from. Defaults to "Authorization".
	Header string
	// Tokens is the list of valid token values. Empty list → always 401 (fail-closed).
	// For the Authorization header, the "Bearer " prefix is stripped before comparison.
	Tokens []string
	// SkipPaths is a list of exact request paths that bypass token validation.
	SkipPaths []string
}

// TokenAuth returns an Echo middleware that validates a static bearer/API-key token.
// Comparison is constant-time to prevent timing attacks. Token values are never logged.
func TokenAuth(cfg TokenAuthConfig) echo.MiddlewareFunc {
	if cfg.Header == "" {
		cfg.Header = "Authorization"
	}

	skipSet := make(map[string]struct{}, len(cfg.SkipPaths))
	for _, p := range cfg.SkipPaths {
		skipSet[p] = struct{}{}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if _, skip := skipSet[c.Request().URL.Path]; skip {
				return next(c)
			}

			raw := c.Request().Header.Get(cfg.Header)
			if cfg.Header == "Authorization" {
				raw = strings.TrimPrefix(raw, "Bearer ")
			}

			for _, token := range cfg.Tokens {
				if subtle.ConstantTimeCompare([]byte(raw), []byte(token)) == 1 {
					return next(c)
				}
			}

			return c.JSON(http.StatusUnauthorized, map[string]interface{}{
				"codeStatus": http.StatusUnauthorized,
				"message":    "Unauthorized",
			})
		}
	}
}
