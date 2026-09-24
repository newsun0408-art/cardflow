package util

import (
	"fmt"
	"strings"

	apperrors "github.com/bangdinh/go-kit/errors"
	"github.com/labstack/echo/v4"
)

// SetETag writes a weak ETag header based on the entity version.
// Format: W/"v{version}" — weak because the representation may change
// (e.g. different serialization options) even for the same version.
//
// Links to domain.Version mixin for optimistic concurrency control.
func SetETag(c echo.Context, version int64) {
	c.Response().Header().Set("ETag", fmt.Sprintf(`W/"v%d"`, version))
}

// CheckIfMatch validates the If-Match request header against the current entity
// version. Returns errors.PreconditionFailed if the versions don't match.
//
// Behavior:
//   - If-Match absent → nil (skip check, no concurrency guard requested)
//   - If-Match: * → nil (any version is acceptable)
//   - If-Match matches current → nil
//   - If-Match doesn't match → PreconditionFailed error
func CheckIfMatch(c echo.Context, currentVersion int64) error {
	header := c.Request().Header.Get("If-Match")
	if header == "" {
		return nil
	}

	// Wildcard means "any version exists"
	if header == "*" {
		return nil
	}

	// Build expected tags: both weak and strong forms
	weakTag := fmt.Sprintf(`W/"v%d"`, currentVersion)
	strongTag := fmt.Sprintf(`"v%d"`, currentVersion)

	// If-Match can contain multiple comma-separated values
	for _, tag := range strings.Split(header, ",") {
		tag = strings.TrimSpace(tag)
		if tag == weakTag || tag == strongTag {
			return nil
		}
	}

	return apperrors.PreconditionFailed(
		fmt.Sprintf("If-Match %s does not match current version v%d", header, currentVersion),
	)
}
