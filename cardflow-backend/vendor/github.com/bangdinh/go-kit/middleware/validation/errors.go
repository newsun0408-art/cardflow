package validation

import (
	apperrors "github.com/bangdinh/go-kit/errors"
)

// NewValidationProblem creates an RFC 9457 ProblemDetail from a field -> reason map.
// Prefer apperrors.ValidationProblemFields when per-field codes are available
// (see ValidateRequestDetailed).
func NewValidationProblem(errs map[string]string, traceID string) apperrors.ProblemDetail {
	return apperrors.ValidationProblem(errs, traceID)
}
