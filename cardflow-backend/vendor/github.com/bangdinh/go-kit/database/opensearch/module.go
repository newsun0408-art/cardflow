package opensearch

import (
	"context"
	"fmt"
	"net/http"

	"github.com/opensearch-project/opensearch-go"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("opensearch",
	fx.Provide(NewHandler),
)

func NewHandler(lc fx.Lifecycle, cfg *Config, logger *zap.Logger) (OpenSearchHandler, error) {
	client, err := opensearch.NewClient(opensearch.Config{
		Addresses: cfg.Addresses,
		Username:  cfg.Username,
		Password:  cfg.Password,
		Transport: &http.Transport{
			MaxConnsPerHost: cfg.MaxConnsPerHost,
		},
	})
	if err != nil {
		return nil, err
	}

	res, err := client.Ping()
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("opensearch ping failed with status: %s", res.String())
	}

	logger.Info("opensearch connected", zap.String("addresses", cfg.Addrs()))

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			logger.Info("closing opensearch client")
			return nil
		},
	})

	return &openSearchHandler{client: client}, nil
}
