package log

import (
	"context"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("logging",
	fx.Provide(NewLoggerFromConfig),
	fx.Invoke(registerLifecycleHooks),
)

func NewLoggerFromConfig(cfg *Config) (*zap.Logger, error) {
	return NewLogger(*cfg)
}

func registerLifecycleHooks(lc fx.Lifecycle, logger *zap.Logger) {
	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			return logger.Sync()
		},
	})
}
