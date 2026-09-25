// Package main - Entrypoint chinh cho HTTP/gRPC Web Server.
//
// Standard Go Project Layout: moi tien trinh la 1 binary duoi cmd/, chia se chung
// domain logic o internal/.
//   - cmd/server  : HTTP/gRPC Web Server (Echo, fx DI, health check).
//   - cmd/migrate : SQL migration runner.
//   - cmd/worker  : background job / queue consumer.
//   - cmd/cli     : admin/devops CLI.
//
// Giu main.go mong (thin entrypoint): chi bootstrap (config, logger, tracer, DI)
// roi chay server; toan bo business logic nam o internal/.
package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	goredis "github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/bangdinh/go-kit/app"
	"github.com/bangdinh/go-kit/config"
	"github.com/bangdinh/go-kit/database/postgres"
	"github.com/bangdinh/go-kit/database/redis"
	"github.com/bangdinh/go-kit/log"
	"github.com/bangdinh/go-kit/observability"
	echomod "github.com/bangdinh/go-kit/server/echo"

	cardfeat "github.com/bangdinh/cardflow-backend/internal/card"
	drivefeat "github.com/bangdinh/cardflow-backend/internal/drive"
	txfeat "github.com/bangdinh/cardflow-backend/internal/transaction"
	samplefeat "github.com/bangdinh/cardflow-backend/internal/sample"
	sheetfeat "github.com/bangdinh/cardflow-backend/internal/sheet"
)

func main() {
	cfg, err := config.Load(config.LoadOptions{ConfigDir: config.DefaultConfigDir()})
	if err != nil {
		panic(err)
	}

	logger, err := log.NewLogger(log.Config{
		Level:       cfg.App.LogLevel,
		Format:      "json",
		Environment: cfg.App.Env,
		ServiceName: "cardflow-backend",
	})
	if err != nil {
		panic(err)
	}

	shutdown, err := observability.InitTracer(context.Background(), observability.TracerConfig{
		ServiceName:  "cardflow-backend",
		Environment:  cfg.App.Env,
		OTLPEndpoint: cfg.Tracing.OTLPEndpoint, // empty -> no-op exporter (no traces exported)
		SampleRatio:  cfg.Tracing.SampleRatio,  // config-driven; lower it in staging/prod (don't ship 100%)
	})
	if err != nil {
		logger.Fatal("tracer init failed", zap.Error(err))
	}
	defer shutdown(context.Background())

	health := observability.NewHealthHandler()

	a, err := app.New(
		app.WithName("cardflow-backend"),
		app.WithLogger(logger),
		app.WithConfig(cfg),
		app.WithFxOption(config.ExtractProviders()),
		app.WithFxModule(observability.MetricsServerModule),
		app.WithFxModule(echomod.Module),
		app.WithFxModule(postgres.Module),
		app.WithFxModule(redis.Module),
		app.WithProviders(
			func() *observability.HealthHandler { return health },
			func() *prometheus.Registry {
				reg := prometheus.NewRegistry()
				reg.MustRegister(
					collectors.NewGoCollector(),
					collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
				)
				return reg
			},
			func(reg *prometheus.Registry) *observability.Metrics {
				return observability.NewMetrics("cardflow_backend", reg)
			},
			func(reg *prometheus.Registry) prometheus.Gatherer { return reg },
			// infra - client providers only
			func(h postgres.PostgresHandler) *pgxpool.Pool { return h.Pool() },
			func(h redis.RedisHandler) goredis.UniversalClient { return h.Client() },
			// sample feature
			func(client goredis.UniversalClient) *samplefeat.Cache {
				return samplefeat.NewCache(client, logger)
			},
			func(pool *pgxpool.Pool, cache *samplefeat.Cache) samplefeat.Repository {
				return samplefeat.NewStore(pool, logger, cache)
			},
			func() drivefeat.Repository { return drivefeat.NewStore() },
			drivefeat.NewService,
			drivefeat.NewHandler,
			sheetfeat.NewService,
			sheetfeat.NewHandler,
			samplefeat.NewService,
			samplefeat.NewHandler,
			// card feature
			func(pool *pgxpool.Pool) cardfeat.Repository {
				return cardfeat.NewStore(pool, logger)
			},
			cardfeat.NewService,
			cardfeat.NewHandler,
			// transaction feature
			func(pool *pgxpool.Pool) txfeat.Repository {
				return txfeat.NewStore(pool, logger)
			},
			txfeat.NewService,
			txfeat.NewHandler,
		),
		app.WithInvokers(mountRoutes),
	)
	if err != nil {
		logger.Fatal("failed to create app", zap.Error(err))
	}

	a.Run()
}

func mountRoutes(e *echo.Echo, h *samplefeat.Handler, dh *drivefeat.Handler, sh *sheetfeat.Handler, ch *cardfeat.Handler, th *txfeat.Handler) {
	// Health probes (/healthz, /readyz) do CORE tu dang ky khi *HealthHandler
	// duoc provide vao fx.
	h.RegisterRoutes(e)
	dh.RegisterRoutes(e)
	sh.RegisterRoutes(e)
	ch.RegisterRoutes(e)
	th.RegisterRoutes(e)
}
