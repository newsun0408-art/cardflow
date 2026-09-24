package observability

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

type HealthChecker interface {
	Check(ctx context.Context) error
}

type HealthCheckerFunc func(ctx context.Context) error

func (f HealthCheckerFunc) Check(ctx context.Context) error {
	return f(ctx)
}

type RegisterOption func(*checkerEntry)

// WithCritical marks the checker as critical: if it fails, the readiness
// endpoint returns 503 so Kubernetes will restart the pod.
func WithCritical() RegisterOption {
	return func(e *checkerEntry) {
		e.critical = true
	}
}

type checkerEntry struct {
	checker  HealthChecker
	critical bool
}

type HealthStatus struct {
	Status     string                 `json:"status"`
	Checks     map[string]CheckResult `json:"checks,omitempty"`
	DurationMs int64                  `json:"duration_ms"`
}

type CheckResult struct {
	Status   string `json:"status"`
	Message  string `json:"message,omitempty"`
	Critical bool   `json:"critical"`
}

type HealthHandler struct {
	mu       sync.RWMutex
	checkers map[string]checkerEntry
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		checkers: make(map[string]checkerEntry),
	}
}

func (h *HealthHandler) Register(name string, checker HealthChecker, opts ...RegisterOption) {
	entry := checkerEntry{checker: checker}
	for _, opt := range opts {
		opt(&entry)
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	h.checkers[name] = entry
}

func (h *HealthHandler) Live(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "alive",
	})
}

func (h *HealthHandler) Ready(c echo.Context) error {
	ctx := c.Request().Context()
	start := time.Now()

	h.mu.RLock()
	entries := make(map[string]checkerEntry, len(h.checkers))
	for k, v := range h.checkers {
		entries[k] = v
	}
	h.mu.RUnlock()

	type result struct {
		name     string
		status   CheckResult
		critical bool
	}
	resultCh := make(chan result, len(entries))

	for name, entry := range entries {
		go func(name string, entry checkerEntry) {
			checkCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
			defer cancel()
			err := entry.checker.Check(checkCtx)
			cr := CheckResult{Critical: entry.critical}
			if err != nil {
				cr.Status = "unhealthy"
				cr.Message = err.Error()
			} else {
				cr.Status = "healthy"
			}
			resultCh <- result{name: name, status: cr, critical: entry.critical}
		}(name, entry)
	}

	checks := make(map[string]CheckResult, len(entries))
	criticalFailed := false
	degraded := false

	for i := 0; i < len(entries); i++ {
		r := <-resultCh
		checks[r.name] = r.status
		if r.status.Status != "healthy" {
			if r.critical {
				criticalFailed = true
			} else {
				degraded = true
			}
		}
	}

	status := "ready"
	httpStatus := http.StatusOK
	switch {
	case criticalFailed:
		status = "not_ready"
		httpStatus = http.StatusServiceUnavailable
	case degraded:
		status = "degraded"
	}

	return c.JSON(httpStatus, HealthStatus{
		Status:     status,
		Checks:     checks,
		DurationMs: time.Since(start).Milliseconds(),
	})
}
