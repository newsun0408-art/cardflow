package echo

import (
	"context"
	stderrors "errors"
	"net/http"
	"time"

	apperrors "github.com/bangdinh/go-kit/errors"

	"github.com/bangdinh/go-kit/app"
	"github.com/bangdinh/go-kit/config"
	plflog "github.com/bangdinh/go-kit/log"
	headermid "github.com/bangdinh/go-kit/middleware/header"
	"github.com/bangdinh/go-kit/observability"
	"github.com/bangdinh/go-kit/util"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// The dedicated /metrics server is NOT part of this module — add
// observability.MetricsServerModule to the app, listed BEFORE echo.Module so
// its lifecycle hook is appended first and (fx stops hooks in reverse order)
// the metrics listener stops LAST, staying scrapeable through the DrainDelay
// window. This module only mounts the app-port /metrics fallback when no
// dedicated metrics address is configured.
var Module = fx.Module("echo",
	fx.Provide(extractConfig),
	fx.Provide(NewEchoFromConfig),
	fx.Invoke(invokeOperationalEndpoints),
	fx.Invoke(registerLifecycleHooks),
)

// fxOperationalParams wraps OperationalParams with fx tags for optional injection.
type fxOperationalParams struct {
	fx.In
	Config   *Config
	Echo     *echo.Echo
	Health   *observability.HealthHandler `optional:"true"`
	Metrics  *observability.Metrics       `optional:"true"`
	Gatherer prometheus.Gatherer          `optional:"true"`
}

func invokeOperationalEndpoints(params fxOperationalParams) {
	registerOperationalEndpoints(params.Echo, OperationalParams{
		Health:      params.Health,
		Metrics:     params.Metrics,
		Gatherer:    observability.ResolveGatherer(params.Metrics, params.Gatherer),
		MetricsAddr: params.Config.MetricsAddr,
	})
}

func extractConfig(cfg *config.Config) *Config {
	api := cfg.API
	host, port := util.ParseHostPort(api.HTTPAddr)
	return &Config{
		Host:         host,
		Port:         port,
		ReadTimeout:  api.Timeout,
		WriteTimeout: api.Timeout,
		IdleTimeout:  api.IdleTimeout,
		TLS: TLSConfig{
			Enabled:  api.HTTPTLS.Enabled,
			CertFile: api.HTTPTLS.CertFile,
			KeyFile:  api.HTTPTLS.KeyFile,
		},
		Swagger: SwaggerConfig{
			Enabled:  api.Swagger.Enabled, // internal surface; controlled per-env by the flag (network/VPN is the boundary)
			BasePath: api.Swagger.BasePath,
			Title:    api.Swagger.Title,
		},
		MetricsAddr: api.MetricsAddr,
	}
}

func NewEchoFromConfig(cfg *Config, logger *zap.Logger) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.HTTPErrorHandler = jsonErrorHandler(logger)

	e.Server.Addr = cfg.Addr()
	e.Server.ReadTimeout = cfg.ReadTimeout
	e.Server.WriteTimeout = cfg.WriteTimeout
	e.Server.IdleTimeout = cfg.IdleTimeout

	e.Use(otelecho.Middleware("echo-server"))
	e.Use(echomiddleware.BodyLimit("10M"))
	e.Use(echomiddleware.RequestID())

	// Baseline security headers on every response. HSTS is emitted only when this
	// server terminates TLS (it is meaningless, and harmful behind plain HTTP).
	secure := echomiddleware.SecureConfig{
		ContentTypeNosniff: "nosniff",
		XFrameOptions:      "DENY",
		ReferrerPolicy:     "no-referrer",
	}
	if cfg.TLS.Enabled {
		secure.HSTSMaxAge = 31536000 // 1 year
	}
	e.Use(echomiddleware.SecureWithConfig(secure))

	e.Use(headermid.MetadataMiddleware())
	e.Use(echomiddleware.Recover())
	// ContextTimeout, KHÔNG phải Timeout. `echomiddleware.Timeout` bọc response writer
	// và gọi Ignore(true) với BẤT KỲ error nào của handler, không riêng timeout
	// (echo v4.15.2 middleware/timeout.go:211) — nuốt luôn response mà handler đã ghi
	// trước khi trả error. Đó chính là hợp đồng mà middleware/validation dựa vào
	// (ghi 422 ProblemDetail rồi `return echo.ErrBadRequest`), nên mọi lỗi validation
	// ra client thành 200 body rỗng. Echo đã deprecate Timeout vì lý do này
	// ("architectural issues that cause data races due to response writer manipulation").
	// ContextTimeout dùng context, không đụng writer, và đặt ở đâu trong chain cũng được.
	//
	// Đánh đổi: ContextTimeout chỉ huỷ request context và map context.DeadlineExceeded
	// thành 503 — nó KHÔNG cắt cứng handler nào phớt lờ context. Chặn cuối vẫn là
	// e.Server.WriteTimeout (đặt ở NewServer bên dưới).
	if cfg.WriteTimeout > 0 {
		e.Use(echomiddleware.ContextTimeoutWithConfig(echomiddleware.ContextTimeoutConfig{
			Timeout: cfg.WriteTimeout,
		}))
	}
	e.Use(zapLoggerMiddleware(logger))

	if cfg.CORS.AllowOrigins != nil {
		e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
			AllowOrigins:     cfg.CORS.AllowOrigins,
			AllowMethods:     cfg.CORS.AllowMethods,
			AllowHeaders:     cfg.CORS.AllowHeaders,
			AllowCredentials: cfg.CORS.AllowCredentials,
			MaxAge:           cfg.CORS.MaxAge,
		}))
	}

	registerSwagger(e, cfg.Swagger)

	return e
}

// RequestLoggerMiddleware returns an Echo middleware that seeds a request-scoped
// logger into the context and logs request start/completion at INFO level.
// Use it on echo instances not created via NewEchoFromConfig (e.g. standalone
// echo servers or BFF services).
func RequestLoggerMiddleware(logger *zap.Logger) echo.MiddlewareFunc {
	return zapLoggerMiddleware(logger)
}

func zapLoggerMiddleware(logger *zap.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			start := time.Now()

			reqLogger := logger.With(
				zap.String("request_id", c.Response().Header().Get(echo.HeaderXRequestID)),
				zap.String("trace_id", traceIDFromContext(req.Context())),
				zap.String("method", req.Method),
				zap.String("uri", req.RequestURI),
				zap.String("remote_addr", c.RealIP()),
			)

			ctx := plflog.WithLogger(req.Context(), reqLogger)
			c.SetRequest(req.WithContext(ctx))

			reqLogger.Info("request started")

			err := next(c)
			res := c.Response()

			fields := []zap.Field{
				zap.String("route", c.Path()),
				zap.Int("status", completedStatus(err, res)),
				zap.Duration("latency", time.Since(start)),
			}
			// `bytes` CHỈ có ý nghĩa khi response đã thực sự được ghi. Ở nhánh
			// lỗi chưa commit thì body chưa tồn tại, ghi 0 là nói dối một con
			// số cụ thể — thà không có trường còn hơn.
			if err == nil || res.Committed {
				fields = append(fields, zap.Int64("bytes", res.Size))
			}
			reqLogger.Info("request completed", fields...)

			return err
		}
	}
}

// traceIDFromContext extracts the OTel trace ID from the context, if present.
func traceIDFromContext(ctx context.Context) string {
	span := trace.SpanFromContext(ctx)
	sc := span.SpanContext()
	if sc.HasTraceID() {
		return sc.TraceID().String()
	}
	return ""
}

// fxLifecycleParams groups dependencies for lifecycle hooks with optional drain delay.
type fxLifecycleParams struct {
	fx.In
	Lifecycle  fx.Lifecycle
	Echo       *echo.Echo
	Config     *Config
	Logger     *zap.Logger
	DrainDelay app.DrainDelay `optional:"true"`
}

func registerLifecycleHooks(params fxLifecycleParams) {
	lc, e, cfg, logger := params.Lifecycle, params.Echo, params.Config, params.Logger
	drainDelay := time.Duration(params.DrainDelay)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			logger.Info("starting echo server", zap.String("addr", cfg.Addr()))

			go func() {
				var err error
				if cfg.TLS.Enabled {
					err = e.StartTLS(cfg.Addr(), cfg.TLS.CertFile, cfg.TLS.KeyFile)
				} else {
					err = e.Start(cfg.Addr())
				}

				if err != nil && !stderrors.Is(err, http.ErrServerClosed) {
					logger.Error("echo server error", zap.Error(err))
				}
			}()

			return nil
		},
		OnStop: func(ctx context.Context) error {
			if drainDelay > 0 {
				logger.Info("drain delay: continuing to serve while LB deregisters",
					zap.Duration("delay", drainDelay))
				time.Sleep(drainDelay)
			}
			logger.Info("stopping echo server")
			return e.Shutdown(ctx)
		},
	})
}

// completedStatus trả status mà client THỰC SỰ nhận được.
//
// Không đọc thẳng res.Status được: Echo gọi HTTPErrorHandler trong ServeHTTP,
// tức là SAU KHI toàn bộ chuỗi middleware đã tháo xong. Tại thời điểm middleware
// log chạy, handler mới chỉ `return err` — chưa ai ghi response, nên res.Status
// vẫn là mặc định 200 và res.Size vẫn 0.
//
// Đây là loại lỗi tự che chính nó: mọi response lỗi vào log thành 200, nên
// dashboard tỷ lệ lỗi luôn xanh kể cả khi 100% request hỏng — và không ai đi
// kiểm một biểu đồ đang xanh (RPA-4825).
//
// res.Committed = true nghĩa là có ai đó (handler, hoặc middleware như
// validation) đã ghi response rồi; lúc đó res.Status mới là sự thật.
func completedStatus(err error, res *echo.Response) int {
	if err == nil || res.Committed {
		return res.Status
	}
	// Dùng chung resolver với middleware metric, để log và dashboard không bao
	// giờ nói hai con số khác nhau về cùng một request.
	return observability.HTTPStatusFromError(err)
}

// problemForError map error sang ProblemDetail.
//
// Tách ra để jsonErrorHandler và middleware log dùng CHUNG một phép map. Hai
// bản sao của luật này sẽ lệch nhau, và lệch kiểu đó im lặng — đúng thứ
// RPA-4825 sinh ra để sửa.
func problemForError(err error, traceID string) apperrors.ProblemDetail {
	var appErr *apperrors.AppError
	if apperrors.As(err, &appErr) {
		return apperrors.ToProblemDetail(err, traceID)
	}

	var he *echo.HTTPError
	if stderrors.As(err, &he) {
		msg := ""
		if m, ok := he.Message.(string); ok {
			msg = m
		}
		problem := apperrors.NewProblemDetail(he.Code, apperrors.CodeForHTTPStatus(he.Code), msg)
		problem.TraceID = traceID
		return problem
	}

	problem := apperrors.NewProblemDetail(
		http.StatusInternalServerError,
		apperrors.CodeInternalError,
		"Internal server error",
	)
	problem.TraceID = traceID
	return problem
}

func jsonErrorHandler(logger *zap.Logger) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}

		// Extract traceID from OTel span or X-Request-Id.
		traceID := traceIDFromContext(c.Request().Context())
		if traceID == "" {
			traceID = c.Response().Header().Get(echo.HeaderXRequestID)
		}

		problem := problemForError(err, traceID)

		logger.Error("request error",
			zap.Int("status", problem.Status),
			zap.String("code", string(problem.Code)),
			zap.String("trace_id", traceID),
			zap.Error(err),
		)

		if c.Request().Method == http.MethodHead {
			c.NoContent(problem.Status) //nolint:errcheck
		} else {
			c.Response().Header().Set("Content-Type", apperrors.ProblemContentType)
			c.JSON(problem.Status, problem) //nolint:errcheck
		}
	}
}
