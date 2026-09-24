package header

import (
	"github.com/bangdinh/go-kit/log"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

const headerContextPrefix = "header:"

// ResponseHeadersMiddleware adds static key/value pairs to every response.
// Keys with empty values are skipped.
func ResponseHeadersMiddleware(headers map[string]string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			for k, v := range headers {
				if v != "" {
					c.Response().Header().Set(k, v)
				}
			}
			return next(c)
		}
	}
}

// PropagateHeadersMiddleware reads each key from the inbound request header,
// stores it in Echo's context, and adds it to the request-scoped zap logger.
// Absent headers are silently skipped.
func PropagateHeadersMiddleware(keys []string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			for _, key := range keys {
				val := c.Request().Header.Get(key)
				if val == "" {
					continue
				}
				c.Set(headerContextPrefix+key, val)
				ctx := log.WithFields(c.Request().Context(), zap.String(key, val))
				c.SetRequest(c.Request().WithContext(ctx))
			}
			return next(c)
		}
	}
}

// GetPropagatedHeader retrieves a header value previously stored by
// PropagateHeadersMiddleware. Returns empty string if absent.
func GetPropagatedHeader(c echo.Context, key string) string {
	val, _ := c.Get(headerContextPrefix + key).(string)
	return val
}
