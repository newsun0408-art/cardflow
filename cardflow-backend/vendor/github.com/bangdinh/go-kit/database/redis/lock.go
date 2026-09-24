package redis

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
)

var (
	// ErrLockNotAcquired is returned when the lock cannot be acquired (already held by another process).
	ErrLockNotAcquired = errors.New("redis: lock not acquired")
	// ErrLockNotHeld is returned when attempting to release or extend a lock not owned by this instance.
	ErrLockNotHeld = errors.New("redis: lock not held or token mismatch")
)

// releaseScript releases the lock only if the token matches.
const releaseScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
	return redis.call("del", KEYS[1])
else
	return 0
end
`

// extendScript extends the lock TTL only if the token matches.
const extendScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
	return redis.call("pexpire", KEYS[1], ARGV[2])
else
	return 0
end
`

// Lock represents an acquired distributed lock.
type Lock interface {
	Key() string
	Token() string
	Release(ctx context.Context) error
	Extend(ctx context.Context, ttl time.Duration) error
}

type redisLock struct {
	client goredis.UniversalClient
	key    string
	token  string
}

func (l *redisLock) Key() string   { return l.key }
func (l *redisLock) Token() string { return l.token }

func (l *redisLock) Release(ctx context.Context) error {
	res, err := l.client.Eval(ctx, releaseScript, []string{l.key}, l.token).Result()
	if err != nil {
		return fmt.Errorf("redis: release lock: %w", err)
	}
	if n, ok := res.(int64); !ok || n == 0 {
		return ErrLockNotHeld
	}
	return nil
}

func (l *redisLock) Extend(ctx context.Context, ttl time.Duration) error {
	res, err := l.client.Eval(ctx, extendScript, []string{l.key}, l.token, ttl.Milliseconds()).Result()
	if err != nil {
		return fmt.Errorf("redis: extend lock: %w", err)
	}
	if n, ok := res.(int64); !ok || n == 0 {
		return ErrLockNotHeld
	}
	return nil
}

// Locker creates distributed locks.
type Locker interface {
	Acquire(ctx context.Context, key string, ttl time.Duration) (Lock, error)
}

type redisLocker struct {
	client goredis.UniversalClient
}

// NewLocker creates a Locker from a Redis UniversalClient.
func NewLocker(client goredis.UniversalClient) Locker {
	return &redisLocker{client: client}
}

func (r *redisLocker) Acquire(ctx context.Context, key string, ttl time.Duration) (Lock, error) {
	token := uuid.NewString()
	ok, err := r.client.SetNX(ctx, key, token, ttl).Result()
	if err != nil {
		return nil, fmt.Errorf("redis: acquire lock: %w", err)
	}
	if !ok {
		return nil, ErrLockNotAcquired
	}
	return &redisLock{
		client: r.client,
		key:    key,
		token:  token,
	}, nil
}
