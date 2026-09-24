package errors

import (
	"errors"
	"fmt"
	"strings"
)

type AppError struct {
	Code     Code
	Message  string
	Cause    error
	Metadata map[string]interface{}
}

func New(code Code, message string) *AppError {
	return &AppError{
		Code:     code,
		Message:  message,
		Metadata: make(map[string]interface{}),
	}
}

func Wrap(code Code, message string, cause error) *AppError {
	return &AppError{
		Code:     code,
		Message:  message,
		Cause:    cause,
		Metadata: make(map[string]interface{}),
	}
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Cause
}

func (e *AppError) WithMetadata(key string, value interface{}) *AppError {
	e.Metadata[key] = value
	return e
}

func Is(err error, code Code) bool {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Code == code
	}
	return false
}

func As(err error, target **AppError) bool {
	return errors.As(err, target)
}

func FormatError(err error) string {
	var appErr *AppError
	if errors.As(err, &appErr) {
		var b strings.Builder
		b.WriteString(fmt.Sprintf("Error: %s\n", appErr.Error()))
		b.WriteString(fmt.Sprintf("Code: %s\n", appErr.Code))
		b.WriteString(fmt.Sprintf("Message: %s\n", appErr.Message))

		if len(appErr.Metadata) > 0 {
			b.WriteString("Metadata:\n")
			for k, v := range appErr.Metadata {
				b.WriteString(fmt.Sprintf("  %s: %v\n", k, v))
			}
		}

		return b.String()
	}
	return err.Error()
}
