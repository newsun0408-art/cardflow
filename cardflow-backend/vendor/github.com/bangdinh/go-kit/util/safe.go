package util

import (
	"fmt"
	"runtime/debug"

	"go.uber.org/zap"
)

// SafeGo runs a function in a new goroutine with panic recovery.
// If the function panics, the panic is caught, logged with stacktrace,
// and the main application process is prevented from crashing.
func SafeGo(logger *zap.Logger, fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				err, ok := r.(error)
				if !ok {
					err = fmt.Errorf("%v", r)
				}
				logger.Error("recovered from panic in goroutine",
					zap.Error(err),
					zap.String("stacktrace", string(debug.Stack())),
				)
			}
		}()
		fn()
	}()
}
