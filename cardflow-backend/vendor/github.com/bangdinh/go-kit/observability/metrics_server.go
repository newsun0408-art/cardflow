package observability

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// MetricsServerConfig configures the dedicated Prometheus metrics listener.
// Production wiring gets it from the global config via
// config.ExtractProviders() (api.metrics_addr, api.timeout, api.idle_timeout,
// api.http_tls) — construct it manually only in tests or standalone setups.
type MetricsServerConfig struct {
	// Addr is the listen address (platform standard ":10254").
	// Empty disables the dedicated server.
	Addr string

	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration

	// TLS mirrors the app server's api.http_tls so environments that scrape
	// over HTTPS keep working when metrics move off the app port.
	TLSEnabled  bool
	TLSCertFile string
	TLSKeyFile  string
}

// MetricsServerModule runs the dedicated /metrics HTTP server (platform
// standard: port :10254, path /metrics, never through the app port) for ANY
// service type — echo, gRPC-only, or worker. Requirements in the fx graph:
//
//   - *MetricsServerConfig — provided by config.ExtractProviders()
//   - *Metrics and/or prometheus.Gatherer — the service's metrics registry
//
// All dependencies are optional: with no metrics provided (or an empty Addr)
// the module is a no-op.
//
// Ordering: list this module BEFORE the server module (echo/grpc) in app.New —
// fx stops hooks in reverse order, so the metrics listener then stops LAST and
// stays scrapeable through the server's drain window.
var MetricsServerModule = fx.Module("metrics-server",
	fx.Invoke(runMetricsServer),
)

type metricsServerParams struct {
	fx.In
	Lifecycle fx.Lifecycle
	Logger    *zap.Logger
	Config    *MetricsServerConfig `optional:"true"`
	Metrics   *Metrics             `optional:"true"`
	Gatherer  prometheus.Gatherer  `optional:"true"`
}

func runMetricsServer(params metricsServerParams) {
	StartMetricsServer(
		params.Lifecycle,
		params.Config,
		ResolveGatherer(params.Metrics, params.Gatherer),
		params.Logger,
	)
}

// ResolveGatherer picks the Gatherer for /metrics endpoints: an explicitly
// provided Gatherer wins; otherwise the registry the Metrics instance was
// built on. Nil when neither is available. Single source of truth for every
// consumer (the dedicated server and echo's app-port fallback), so the two
// modes can never serve different registries.
func ResolveGatherer(m *Metrics, g prometheus.Gatherer) prometheus.Gatherer {
	if g != nil {
		return g
	}
	if m != nil {
		return m.Gatherer()
	}
	return nil
}

// NewMetricsServer builds the dedicated metrics HTTP server. It serves ONLY
// /metrics and inherits the app's timeouts from cfg.
func NewMetricsServer(cfg *MetricsServerConfig, gatherer prometheus.Gatherer) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(gatherer, promhttp.HandlerOpts{}))
	return &http.Server{
		Addr:              cfg.Addr,
		Handler:           mux,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

// StartMetricsServer runs the dedicated metrics server via fx lifecycle.
// No-op when cfg is nil, cfg.Addr is empty, or gatherer is nil.
//
// The port is bound synchronously in OnStart so a taken or invalid address
// fails startup (fail fast) instead of leaving the service running with no
// metrics endpoint anywhere. TLS follows cfg (mirroring api.http_tls).
func StartMetricsServer(lc fx.Lifecycle, cfg *MetricsServerConfig, gatherer prometheus.Gatherer, logger *zap.Logger) {
	if cfg == nil || cfg.Addr == "" || gatherer == nil {
		return
	}

	srv := NewMetricsServer(cfg, gatherer)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			ln, err := net.Listen("tcp", cfg.Addr)
			if err != nil {
				return fmt.Errorf("metrics server: listen %s: %w", cfg.Addr, err)
			}
			logger.Info("starting metrics server",
				zap.String("addr", cfg.Addr),
				zap.Bool("tls", cfg.TLSEnabled),
			)
			go func() {
				var serveErr error
				if cfg.TLSEnabled {
					serveErr = srv.ServeTLS(ln, cfg.TLSCertFile, cfg.TLSKeyFile)
				} else {
					serveErr = srv.Serve(ln)
				}
				if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
					logger.Error("metrics server error", zap.Error(serveErr))
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			logger.Info("stopping metrics server")
			return srv.Shutdown(ctx)
		},
	})
}
