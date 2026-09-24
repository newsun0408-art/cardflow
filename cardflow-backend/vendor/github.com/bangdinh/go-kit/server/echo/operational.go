package echo

import (
	"github.com/bangdinh/go-kit/observability"
	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// OperationalParams holds optional dependencies for operational endpoints.
// When used with fx, tag fields with `optional:"true"` so services that don't
// provide a HealthHandler or Metrics don't fail.
type OperationalParams struct {
	// Health is the health handler. When present, /healthz and /readyz are registered.
	Health *observability.HealthHandler `optional:"true"`

	// Metrics is the Prometheus metrics instance. When present (along with Gatherer),
	// /metrics is registered.
	Metrics *observability.Metrics `optional:"true"`

	// Gatherer is the Prometheus gatherer for the /metrics endpoint.
	// Defaults to prometheus.DefaultGatherer if Metrics is present but Gatherer is nil.
	Gatherer prometheus.Gatherer `optional:"true"`

	// MetricsAddr, when non-empty, means /metrics is served by a dedicated
	// HTTP server on that address (platform standard :10254) — it is then
	// NOT mounted on the app server. Empty = legacy behavior (metrics on
	// the app server).
	MetricsAddr string
}

// registerOperationalEndpoints auto-registers /healthz, /readyz, and /metrics
// on the Echo instance when the corresponding dependencies are available.
//
// Called from the fx module. All dependencies are optional — if none are
// provided, no routes are added and the function is a no-op.
func registerOperationalEndpoints(e *echo.Echo, params OperationalParams) {
	if params.Health != nil {
		e.GET("/healthz", params.Health.Live)
		e.GET("/readyz", params.Health.Ready)
	}

	// /metrics is mounted on the app server only when no dedicated metrics
	// address is configured — the platform standard serves it on a separate
	// port via observability.MetricsServerModule.
	if params.MetricsAddr == "" {
		if gatherer := observability.ResolveGatherer(params.Metrics, params.Gatherer); gatherer != nil {
			e.GET("/metrics", echo.WrapHandler(promhttp.HandlerFor(gatherer, promhttp.HandlerOpts{})))
		}
	}
}
