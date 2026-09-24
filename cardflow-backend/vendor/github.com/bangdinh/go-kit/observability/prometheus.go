package observability

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// DBOperation is the type of database query. Use the DBOp* constants — never
// pass raw SQL or table names here, as that would create unbounded cardinality.
type DBOperation string

const (
	DBOpSelect DBOperation = "select"
	DBOpInsert DBOperation = "insert"
	DBOpUpdate DBOperation = "update"
	DBOpDelete DBOperation = "delete"
	DBOpExec   DBOperation = "exec"
)

type Metrics struct {
	httpRequestsTotal     *prometheus.CounterVec
	httpRequestDuration   *prometheus.HistogramVec
	GRPCRequestsTotal     *prometheus.CounterVec
	GRPCRequestDuration   *prometheus.HistogramVec
	databaseQueryDuration *prometheus.HistogramVec
	databaseQueryTotal    *prometheus.CounterVec

	registerer prometheus.Registerer
}

// Gatherer returns the Gatherer view of the registry this Metrics was built
// on, so /metrics endpoints serve the registry that actually holds the app's
// metrics. *prometheus.Registry (including DefaultRegisterer) implements
// both interfaces; for an exotic Registerer that doesn't, this falls back to
// prometheus.DefaultGatherer.
func (m *Metrics) Gatherer() prometheus.Gatherer {
	if g, ok := m.registerer.(prometheus.Gatherer); ok {
		return g
	}
	return prometheus.DefaultGatherer
}

// NewMetrics creates a Metrics instance registered to reg.
// Pass prometheus.DefaultRegisterer for production; pass a fresh
// prometheus.NewRegistry() in tests to avoid duplicate-registration panics.
func NewMetrics(namespace string, reg prometheus.Registerer) *Metrics {
	factory := promauto.With(reg)
	return &Metrics{
		registerer: reg,
		httpRequestsTotal: factory.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "http_requests_total",
				Help:      "Total number of HTTP requests",
			},
			[]string{"method", "path", "status"},
		),
		httpRequestDuration: factory.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: namespace,
				Name:      "http_request_duration_seconds",
				Help:      "HTTP request duration in seconds",
				Buckets:   prometheus.DefBuckets,
			},
			[]string{"method", "path", "status"},
		),
		GRPCRequestsTotal: factory.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "grpc_requests_total",
				Help:      "Total number of gRPC requests",
			},
			[]string{"method", "status"},
		),
		GRPCRequestDuration: factory.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: namespace,
				Name:      "grpc_request_duration_seconds",
				Help:      "gRPC request duration in seconds",
				Buckets:   prometheus.DefBuckets,
			},
			[]string{"method", "status"},
		),
		databaseQueryDuration: factory.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: namespace,
				Name:      "database_query_duration_seconds",
				Help:      "Database query duration in seconds",
				Buckets:   prometheus.DefBuckets,
			},
			[]string{"database", "operation"},
		),
		databaseQueryTotal: factory.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "database_query_total",
				Help:      "Total number of database queries",
			},
			[]string{"database", "operation", "status"},
		),
	}
}

// RecordHTTPRequest increments the HTTP request counter.
// routePattern must be the route template (e.g. "/users/:id"), never a raw URL path.
func (m *Metrics) RecordHTTPRequest(method, routePattern, status string) {
	m.httpRequestsTotal.WithLabelValues(method, routePattern, status).Inc()
}

// ObserveHTTPRequestDuration records a duration sample in the HTTP histogram.
// routePattern must be the route template, never a raw URL path.
func (m *Metrics) ObserveHTTPRequestDuration(method, routePattern, status string, durationSec float64) {
	m.httpRequestDuration.WithLabelValues(method, routePattern, status).Observe(durationSec)
}

// RecordDBQuery increments the database query counter.
// database is the logical name (e.g. "postgres", "mysql") — never a DSN or connection string.
func (m *Metrics) RecordDBQuery(database string, op DBOperation, status string) {
	m.databaseQueryTotal.WithLabelValues(database, string(op), status).Inc()
}

// ObserveDBQueryDuration records a duration sample in the database histogram.
func (m *Metrics) ObserveDBQueryDuration(database string, op DBOperation, durationSec float64) {
	m.databaseQueryDuration.WithLabelValues(database, string(op)).Observe(durationSec)
}

// HTTPRequestsTotal exposes the underlying collector for testutil.CollectAndCompare.
func (m *Metrics) HTTPRequestsTotal() prometheus.Collector {
	return m.httpRequestsTotal
}

// HTTPRequestDurationCollector exposes the underlying collector for testutil assertions.
func (m *Metrics) HTTPRequestDurationCollector() prometheus.Collector {
	return m.httpRequestDuration
}

// DatabaseQueryTotal exposes the underlying collector for testutil.CollectAndCompare.
func (m *Metrics) DatabaseQueryTotal() prometheus.Collector {
	return m.databaseQueryTotal
}

// DatabaseQueryDurationCollector exposes the underlying collector for testutil assertions.
func (m *Metrics) DatabaseQueryDurationCollector() prometheus.Collector {
	return m.databaseQueryDuration
}
