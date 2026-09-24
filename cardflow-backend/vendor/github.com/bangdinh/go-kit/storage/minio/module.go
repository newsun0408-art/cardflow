package minio

import (
	"fmt"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

// Module wires a single-endpoint MinioHandler from *Config.
// Use this when your service talks to one S3 endpoint configured at startup.
var Module = fx.Module("minio",
	fx.Provide(NewHandler),
)

// PoolModule wires a *ClientPool singleton.
// Use this when your service generates presigned URLs for multiple MinIO servers
// or multiple S3 accounts — each unique (endpoint, accessKey, region, useSSL)
// combination gets its own cached *minio.Client.
var PoolModule = fx.Module("minio_pool",
	fx.Provide(NewClientPool),
)

// NewHandler creates a MinioHandler from Config.
// minio.New() does not open a network connection; the first real call does.
func NewHandler(cfg *Config, logger *zap.Logger) (MinioHandler, error) {
	client, err := newClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("minio: create client: %w", err)
	}

	logger.Info("minio client created",
		zap.String("endpoint", cfg.Endpoint),
		zap.String("region", cfg.Region),
		zap.Bool("use_ssl", cfg.UseSSL),
	)

	return &minioHandler{client: client}, nil
}
