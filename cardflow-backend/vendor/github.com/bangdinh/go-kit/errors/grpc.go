package errors

import (
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func ToGRPCStatus(err error) *status.Status {
	var appErr *AppError
	if !errors.As(err, &appErr) {
		return status.New(codes.Internal, "An unexpected error occurred")
	}

	code := mapToGRPCCode(appErr.Code)
	return status.New(code, appErr.Message)
}

func mapToGRPCCode(code Code) codes.Code {
	switch code {
	case CodeNotFound:
		return codes.NotFound
	case CodeUnauthorized:
		return codes.Unauthenticated
	case CodeForbidden:
		return codes.PermissionDenied
	case CodeInvalidInput:
		return codes.InvalidArgument
	case CodeValidationFailed:
		return codes.InvalidArgument
	case CodeAlreadyExists:
		return codes.AlreadyExists
	case CodeServiceUnavailable:
		return codes.Unavailable
	case CodeTimeout:
		return codes.DeadlineExceeded
	case CodeRateLimited:
		return codes.ResourceExhausted
	case CodeConflict:
		return codes.Aborted
	case CodePreconditionFailed:
		return codes.FailedPrecondition
	case CodeOutOfRange:
		return codes.OutOfRange
	case CodeUnimplemented:
		return codes.Unimplemented
	case CodeDataLoss:
		return codes.DataLoss
	default:
		return codes.Internal
	}
}
