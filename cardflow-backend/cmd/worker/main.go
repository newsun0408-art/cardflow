// Package main — Entrypoint cho Background Worker Process.
//
// Quy chuẩn kiến trúc: Standard Go Project Layout (golang-standards/project-layout)
//   - Vai trò: Tiến trình xử lý công việc ngầm, lắng nghe Kafka/MQTT events, chạy cronjobs, gửi email...
//     độc lập hoàn toàn với HTTP Web Server chính để tránh làm treo request của user.
//   - Cách dùng:
//     go run ./cmd/worker
package main

import (
	"context"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"go.uber.org/zap"

	"github.com/bangdinh/go-kit/app"
	"github.com/bangdinh/go-kit/config"
	"github.com/bangdinh/go-kit/log"
	"github.com/bangdinh/go-kit/observability"
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
		ServiceName: "cardflow-backend-worker",
	})
	if err != nil {
		panic(err)
	}

	shutdown, err := observability.InitTracer(context.Background(), observability.TracerConfig{
		ServiceName: "cardflow-backend-worker",
		Environment: cfg.App.Env,
		SampleRatio: 1.0,
	})
	if err != nil {
		logger.Fatal("tracer init failed", zap.Error(err))
	}
	defer shutdown(context.Background())

	a, err := app.New(
		app.WithName("cardflow-backend-worker"),
		app.WithLogger(logger),
		app.WithConfig(cfg),
		app.WithFxOption(config.ExtractProviders()),
		// Worker cũng expose /metrics trên api.metrics_addr (:10254) — chuẩn
		// platform áp dụng cho MỌI process, không riêng web server.
		app.WithFxModule(observability.MetricsServerModule),
		app.WithProviders(
			func() *prometheus.Registry {
				reg := prometheus.NewRegistry()
				reg.MustRegister(
					collectors.NewGoCollector(),
					collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
				)
				return reg
			},
			func(reg *prometheus.Registry) *observability.Metrics {
				return observability.NewMetrics("cardflow_backend_worker", reg)
			},
			func(reg *prometheus.Registry) prometheus.Gatherer { return reg },
		),
		app.WithInvokers(startWorker),
	)
	if err != nil {
		logger.Fatal("failed to create worker app", zap.Error(err))
	}

	a.Run()
}

func startWorker(logger *zap.Logger) {
	logger.Info("background worker started and listening for jobs/events...")
}
