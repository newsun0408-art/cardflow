package redis

import (
	"context"
	"crypto/tls"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("redis",
	fx.Provide(NewHandler),
	fx.Provide(ProvideLocker),
)

// ProvideLocker provides a Locker instance using the handler's Redis client.
func ProvideLocker(h RedisHandler) Locker {
	return NewLocker(h.Client())
}

func NewHandler(lc fx.Lifecycle, cfg *Config, logger *zap.Logger) (RedisHandler, error) {
	opts := &goredis.UniversalOptions{
		Addrs:        cfg.Addrs,
		Password:     cfg.Password,
		DB:           cfg.DB,
		MasterName:   cfg.MasterName,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.MinIdleConns,
		DialTimeout:  cfg.DialTimeout,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	if cfg.TLS {
		opts.TLSConfig = &tls.Config{}
	}

	client := goredis.NewUniversalClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("redis: ping failed: %w", err)
	}

	logger.Info("redis connected",
		zap.Strings("addrs", cfg.Addrs),
		zap.Int("pool_size", cfg.PoolSize),
		zap.Duration("dial_timeout", cfg.DialTimeout),
		zap.Duration("read_timeout", cfg.ReadTimeout),
		zap.Duration("write_timeout", cfg.WriteTimeout),
	)

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			logger.Info("closing redis client")
			return client.Close()
		},
	})

	return &redisHandler{client: client}, nil
}
