package errors

import (
	"errors"
	"net/http"
	"sort"
)

// ProblemDetail implements RFC 9457 Problem Details for HTTP APIs.
// This is the standard format for ALL error responses in the system.
type ProblemDetail struct {
	// Type — URI reference describing the error type. Defaults to "about:blank".
	Type string `json:"type"`
	// Title — short, human-readable summary; stable across instances.
	Title string `json:"title"`
	// Status — HTTP status code.
	Status int `json:"status"`
	// Code — stable error code for client logic (switch/case). Maps from errors.Code.
	Code Code `json:"code"`
	// TraceID — correlation ID for tracing the request across the system.
	TraceID string `json:"traceId,omitempty"`
	// Detail — human-readable explanation, may vary per instance.
	Detail string `json:"detail,omitempty"`
	// Errors — field-level validation errors.
	Errors []FieldError `json:"errors,omitempty"`
}

// FieldError describes a validation error on a specific field.
type FieldError struct {
	Field  string `json:"field"`
	Code   string `json:"code,omitempty"` // stable per-field code (UPPER_SNAKE), e.g. REQUIRED
	Reason string `json:"reason"`
}

// ProblemContentType is the Content-Type for error responses per RFC 9457.
const ProblemContentType = "application/problem+json"

// ToProblemDetail converts an error (typically *AppError) into a ProblemDetail.
// traceID should come from OpenTelemetry span context or X-Request-Id.
func ToProblemDetail(err error, traceID string) ProblemDetail {
	var appErr *AppError
	if !errors.As(err, &appErr) {
		return ProblemDetail{
			Type:    "about:blank",
			Title:   CodeInternalError.Title(),
			Status:  http.StatusInternalServerError,
			Code:    CodeInternalError,
			TraceID: traceID,
			Detail:  err.Error(),
		}
	}

	status := codeToHTTPStatus(appErr.Code)

	return ProblemDetail{
		Type:    "about:blank",
		Title:   appErr.Code.Title(),
		Status:  status,
		Code:    appErr.Code,
		TraceID: traceID,
		Detail:  appErr.Message,
	}
}

// NewProblemDetail creates a ProblemDetail from status, code, and title
// without going through AppError.
func NewProblemDetail(status int, code Code, title string) ProblemDetail {
	t := title
	if t == "" {
		t = code.Title()
	}
	return ProblemDetail{
		Type:   "about:blank",
		Title:  t,
		Status: status,
		Code:   code,
	}
}

// ValidationProblemFields builds a 422 ProblemDetail from field errors that carry
// per-field codes (RFC 9457 + VMSN-STD-API-001 §Error). Prefer this over
// ValidationProblem when the source can attach a stable code to each field.
func ValidationProblemFields(fields []FieldError, traceID string) ProblemDetail {
	return ProblemDetail{
		Type:    "about:blank",
		Title:   CodeValidationFailed.Title(),
		Status:  http.StatusUnprocessableEntity,
		Code:    CodeValidationFailed,
		TraceID: traceID,
		Errors:  fields,
	}
}

// ValidationProblem creates a ProblemDetail for validation errors.
// It converts map[string]string (field→reason) to []FieldError.
func ValidationProblem(fieldErrors map[string]string, traceID string) ProblemDetail {
	errs := make([]FieldError, 0, len(fieldErrors))
	for field, reason := range fieldErrors {
		errs = append(errs, FieldError{Field: field, Reason: reason})
	}
	// Sort for deterministic output.
	sort.Slice(errs, func(i, j int) bool {
		return errs[i].Field < errs[j].Field
	})

	return ProblemDetail{
		Type:    "about:blank",
		Title:   CodeValidationFailed.Title(),
		Status:  http.StatusUnprocessableEntity,
		Code:    CodeValidationFailed,
		TraceID: traceID,
		Errors:  errs,
	}
}

// CodeForHTTPStatus returns the most appropriate Code for a given HTTP status.
// Used when converting echo.HTTPError (which only has a status) to ProblemDetail.
func CodeForHTTPStatus(status int) Code {
	switch status {
	case http.StatusBadRequest:
		return CodeInvalidInput
	case http.StatusUnauthorized:
		return CodeUnauthorized
	case http.StatusForbidden:
		return CodeForbidden
	case http.StatusNotFound:
		return CodeNotFound
	case http.StatusConflict:
		return CodeConflict
	case http.StatusUnprocessableEntity:
		return CodeValidationFailed
	case http.StatusTooManyRequests:
		return CodeRateLimited
	case http.StatusNotImplemented:
		return CodeUnimplemented
	case http.StatusBadGateway, http.StatusServiceUnavailable:
		return CodeServiceUnavailable
	case http.StatusGatewayTimeout:
		return CodeTimeout
	default:
		return CodeInternalError
	}
}

// codeToHTTPStatus maps an error Code to its HTTP status code.
// This is the single source of truth for Code→HTTP mapping.
func codeToHTTPStatus(code Code) int {
	switch code {
	case CodeNotFound:
		return http.StatusNotFound
	case CodeUnauthorized:
		return http.StatusUnauthorized
	case CodeForbidden:
		return http.StatusForbidden
	case CodeInvalidInput:
		return http.StatusBadRequest
	case CodeValidationFailed:
		return http.StatusUnprocessableEntity
	case CodeAlreadyExists:
		return http.StatusConflict
	case CodeServiceUnavailable:
		return http.StatusServiceUnavailable
	case CodeTimeout:
		return http.StatusGatewayTimeout
	case CodeRateLimited:
		return http.StatusTooManyRequests
	case CodeConflict:
		return http.StatusConflict
	case CodePreconditionFailed:
		return http.StatusPreconditionFailed
	case CodeOutOfRange:
		return http.StatusBadRequest
	case CodeUnimplemented:
		return http.StatusNotImplemented
	case CodeDataLoss:
		return http.StatusInternalServerError
	default:
		return http.StatusInternalServerError
	}
}
