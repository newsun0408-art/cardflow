package mongo

import (
	"context"
	"fmt"
	"time"

	mongodrv "go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("mongo",
	fx.Provide(NewHandler),
)

func NewHandler(lc fx.Lifecycle, cfg *Config, logger *zap.Logger) (MongoHandler, error) {
	opts := options.Client().ApplyURI(cfg.URI())
	if cfg.MaxPoolSize > 0 {
		opts.SetMaxPoolSize(cfg.MaxPoolSize)
	}
	if cfg.MinPoolSize > 0 {
		opts.SetMinPoolSize(cfg.MinPoolSize)
	}
	if cfg.ConnectTimeout > 0 {
		opts.SetConnectTimeout(cfg.ConnectTimeout)
	}

	connectCtx, connectCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer connectCancel()

	client, err := mongodrv.Connect(connectCtx, opts)
	if err != nil {
		return nil, fmt.Errorf("mongo: connect failed: %w", err)
	}

	pingCtx, pingCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer pingCancel()

	if err := client.Ping(pingCtx, nil); err != nil {
		client.Disconnect(context.Background())
		return nil, fmt.Errorf("mongo: ping failed: %w", err)
	}

	logger.Info("mongo connected",
		zap.String("addr", cfg.Addr()),
		zap.Uint64("max_pool_size", cfg.MaxPoolSize),
		zap.Uint64("min_pool_size", cfg.MinPoolSize),
		zap.Duration("connect_timeout", cfg.ConnectTimeout),
	)

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			logger.Info("closing mongo client")
			return client.Disconnect(ctx)
		},
	})

	return &mongoHandler{client: client}, nil
}
