package redis

import (
	"context"
	"fmt"

	goredis "github.com/redis/go-redis/v9"
)

// RedisHandler wraps UniversalClient and implements observability.HealthChecker.
type RedisHandler interface {
	Check(ctx context.Context) error
	Client() goredis.UniversalClient
}

type redisHandler struct {
	client goredis.UniversalClient
}

func (h *redisHandler) Client() goredis.UniversalClient { return h.client }

func (h *redisHandler) Check(ctx context.Context) error {
	if err := h.client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis: %w", err)
	}
	return nil
}
