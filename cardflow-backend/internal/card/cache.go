package card

import (
	"context"
	"encoding/json"
	"time"

	goredis "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Cache handles Redis caching for Card entities.
type Cache struct {
	client goredis.UniversalClient
	log    *zap.Logger
	ttl    time.Duration
}

// NewCache creates a new Redis cache for card.
func NewCache(client goredis.UniversalClient, log *zap.Logger) *Cache {
	return &Cache{client: client, log: log, ttl: 10 * time.Minute}
}

// Get retrieves a cached Card.
func (c *Cache) Get(ctx context.Context, id string) (Card, bool) {
	if c == nil || c.client == nil {
		return Card{}, false
	}
	val, err := c.client.Get(ctx, c.key(id)).Result()
	if err != nil {
		return Card{}, false
	}
	var entry Card
	if err := json.Unmarshal([]byte(val), &entry); err != nil {
		return Card{}, false
	}
	return entry, true
}

// Set caches a Card entity.
func (c *Cache) Set(ctx context.Context, id string, e Card) {
	if c == nil || c.client == nil {
		return
	}
	b, err := json.Marshal(e)
	if err != nil {
		return
	}
	_ = c.client.Set(ctx, c.key(id), b, c.ttl).Err()
}

// Invalidate removes cached Card.
func (c *Cache) Invalidate(ctx context.Context, id string) {
	if c == nil || c.client == nil {
		return
	}
	_ = c.client.Del(ctx, c.key(id)).Err()
}

func (c *Cache) key(id string) string {
	return "card:" + id
}
