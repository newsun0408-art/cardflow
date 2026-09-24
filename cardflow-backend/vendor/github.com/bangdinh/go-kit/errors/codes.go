package errors

type Code string

const (
	CodeNotFound           Code = "NOT_FOUND"
	CodeUnauthorized       Code = "UNAUTHORIZED"
	CodeForbidden          Code = "FORBIDDEN"
	CodeInvalidInput       Code = "INVALID_INPUT"
	CodeValidationFailed   Code = "VALIDATION_FAILED"
	CodeAlreadyExists      Code = "ALREADY_EXISTS"
	CodeInternalError      Code = "INTERNAL_ERROR"
	CodeServiceUnavailable Code = "SERVICE_UNAVAILABLE"
	CodeTimeout            Code = "TIMEOUT"
	CodeRateLimited        Code = "RATE_LIMITED"
	CodeConflict           Code = "CONFLICT"
	CodePreconditionFailed Code = "PRECONDITION_FAILED"
	CodeOutOfRange         Code = "OUT_OF_RANGE"
	CodeUnimplemented      Code = "UNIMPLEMENTED"
	CodeDataLoss           Code = "DATA_LOSS"
)

// codeTitle maps each Code to its default human-readable title for ProblemDetail.
var codeTitle = map[Code]string{
	CodeNotFound:           "Resource not found",
	CodeUnauthorized:       "Authentication required",
	CodeForbidden:          "Permission denied",
	CodeInvalidInput:       "Invalid input",
	CodeValidationFailed:   "Validation failed",
	CodeAlreadyExists:      "Resource already exists",
	CodeInternalError:      "Internal server error",
	CodeServiceUnavailable: "Service unavailable",
	CodeTimeout:            "Request timeout",
	CodeRateLimited:        "Too many requests",
	CodeConflict:           "Conflict",
	CodePreconditionFailed: "Precondition failed",
	CodeOutOfRange:         "Value out of range",
	CodeUnimplemented:      "Not implemented",
	CodeDataLoss:           "Data loss",
}

// Title returns the default human-readable title for this Code.
func (c Code) Title() string {
	if t, ok := codeTitle[c]; ok {
		return t
	}
	return "Error"
}

func (c Code) String() string {
	return string(c)
}

func NotFound(message string) *AppError {
	return New(CodeNotFound, message)
}

func Unauthorized(message string) *AppError {
	return New(CodeUnauthorized, message)
}

func Forbidden(message string) *AppError {
	return New(CodeForbidden, message)
}

func InvalidInput(message string) *AppError {
	return New(CodeInvalidInput, message)
}

func AlreadyExists(message string) *AppError {
	return New(CodeAlreadyExists, message)
}

func InternalError(message string) *AppError {
	return New(CodeInternalError, message)
}

func InternalErrorWrap(message string, cause error) *AppError {
	return Wrap(CodeInternalError, message, cause)
}

func ServiceUnavailable(message string) *AppError {
	return New(CodeServiceUnavailable, message)
}

func Timeout(message string) *AppError {
	return New(CodeTimeout, message)
}

func RateLimited(message string) *AppError {
	return New(CodeRateLimited, message)
}

func Conflict(message string) *AppError {
	return New(CodeConflict, message)
}

func PreconditionFailed(message string) *AppError {
	return New(CodePreconditionFailed, message)
}

func OutOfRange(message string) *AppError {
	return New(CodeOutOfRange, message)
}

func Unimplemented(message string) *AppError {
	return New(CodeUnimplemented, message)
}

func DataLoss(message string) *AppError {
	return New(CodeDataLoss, message)
}

func ValidationFailed(message string) *AppError {
	return New(CodeValidationFailed, message)
}
