package sample

import (
	"context"
	"encoding/json"
	"time"

	goredis "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Cache handles Redis caching for Sample entities.
// On error: log warn and return miss — never surface cache errors to callers.
type Cache struct {
	client goredis.UniversalClient
	log    *zap.Logger
	ttl    time.Duration
}

// NewCache creates a new Redis cache for sample.
func NewCache(client goredis.UniversalClient, log *zap.Logger) *Cache {
	return &Cache{client: client, log: log, ttl: 5 * time.Minute}
}

// Get retrieves a cached Sample. Returns false on miss or error.
func (c *Cache) Get(ctx context.Context, id string) (Sample, bool) {
	val, err := c.client.Get(ctx, c.key(id)).Result()
	if err != nil {
		if err != goredis.Nil {
			c.log.Warn("cache get error", zap.String("id", id), zap.Error(err))
		}
		return Sample{}, false
	}
	var entry Sample
	if err := json.Unmarshal([]byte(val), &entry); err != nil {
		c.log.Warn("cache unmarshal error", zap.Error(err))
		return Sample{}, false
	}
	return entry, true
}

// Set caches a Sample entity.
func (c *Cache) Set(ctx context.Context, id string, e Sample) {
	b, err := json.Marshal(e)
	if err != nil {
		c.log.Warn("cache marshal error", zap.Error(err))
		return
	}
	if err := c.client.Set(ctx, c.key(id), b, c.ttl).Err(); err != nil {
		c.log.Warn("cache set error", zap.String("id", id), zap.Error(err))
	}
}

func (c *Cache) key(id string) string {
	return "sample:" + id
}
