// Package main - Entrypoint chinh cho HTTP/gRPC Web Server.
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
		OTLPEndpoint: cfg.Tracing.OTLPEndpoint,
		SampleRatio:  cfg.Tracing.SampleRatio,
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
			func(client goredis.UniversalClient) *cardfeat.Cache {
				return cardfeat.NewCache(client, logger)
			},
			func(pool *pgxpool.Pool, cache *cardfeat.Cache) cardfeat.Repository {
				return cardfeat.NewStore(pool, logger, cache)
			},
			cardfeat.NewService,
			cardfeat.NewHandler,
		),
		app.WithInvokers(mountRoutes),
	)
	if err != nil {
		logger.Fatal("failed to create app", zap.Error(err))
	}

	a.Run()
}

func mountRoutes(e *echo.Echo, h *samplefeat.Handler, dh *drivefeat.Handler, sh *sheetfeat.Handler, ch *cardfeat.Handler) {
	h.RegisterRoutes(e)
	dh.RegisterRoutes(e)
	sh.RegisterRoutes(e)
	ch.RegisterRoutes(e)
}
