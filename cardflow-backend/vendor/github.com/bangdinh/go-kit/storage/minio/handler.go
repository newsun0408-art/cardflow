package minio

import (
	"context"
	"fmt"
	"net/url"
	"sync"
	"time"

	miniogo "github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioHandler wraps a single *minio.Client and implements observability.HealthChecker.
type MinioHandler interface {
	// Client returns the underlying minio client for direct use.
	Client() *miniogo.Client
	// Check verifies connectivity by listing buckets.
	Check(ctx context.Context) error
	// PresignedGetURL returns a presigned URL for reading an object.
	PresignedGetURL(ctx context.Context, bucket, object string, expiry time.Duration) (string, error)
	// PresignedPutURL returns a presigned URL for uploading an object.
	PresignedPutURL(ctx context.Context, bucket, object string, expiry time.Duration) (string, error)
}

type minioHandler struct {
	client *miniogo.Client
}

func (h *minioHandler) Client() *miniogo.Client { return h.client }

func (h *minioHandler) Check(ctx context.Context) error {
	if _, err := h.client.ListBuckets(ctx); err != nil {
		return fmt.Errorf("minio: %w", err)
	}
	return nil
}

func (h *minioHandler) PresignedGetURL(ctx context.Context, bucket, object string, expiry time.Duration) (string, error) {
	u, err := h.client.PresignedGetObject(ctx, bucket, object, expiry, url.Values{})
	if err != nil {
		return "", fmt.Errorf("presign GET %s/%s: %w", bucket, object, err)
	}
	return u.String(), nil
}

func (h *minioHandler) PresignedPutURL(ctx context.Context, bucket, object string, expiry time.Duration) (string, error) {
	u, err := h.client.PresignedPutObject(ctx, bucket, object, expiry)
	if err != nil {
		return "", fmt.Errorf("presign PUT %s/%s: %w", bucket, object, err)
	}
	return u.String(), nil
}

// clientCacheKey identifies a unique S3 connection.
type clientCacheKey struct {
	endpoint  string
	accessKey string
	region    string
	useSSL    bool
}

// ClientPool caches *minio.Client instances keyed by (endpoint, accessKey, region, useSSL).
// Use this when a service connects to multiple S3 endpoints with different credentials.
// Safe for concurrent use.
type ClientPool struct {
	mu      sync.RWMutex
	clients map[clientCacheKey]*miniogo.Client
}

// NewClientPool creates an empty ClientPool.
func NewClientPool() *ClientPool {
	return &ClientPool{clients: make(map[clientCacheKey]*miniogo.Client)}
}

// Get returns a cached *minio.Client or creates one on cache miss.
// endpoint must be a bare host or host:port — no http:// or https:// prefix.
// secretKey is used only when creating a new client.
func (p *ClientPool) Get(endpoint, accessKey, secretKey, region string, useSSL bool) (*miniogo.Client, error) {
	key := clientCacheKey{endpoint: endpoint, accessKey: accessKey, region: region, useSSL: useSSL}

	p.mu.RLock()
	client, ok := p.clients[key]
	p.mu.RUnlock()
	if ok {
		return client, nil
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	if client, ok = p.clients[key]; ok {
		return client, nil
	}

	client, err := miniogo.New(endpoint, &miniogo.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: region,
	})
	if err != nil {
		return nil, fmt.Errorf("minio client for %q: %w", endpoint, err)
	}
	p.clients[key] = client
	return client, nil
}

// PresignedGetURL generates a presigned GET URL using a pooled client for the given endpoint.
func (p *ClientPool) PresignedGetURL(ctx context.Context, endpoint, accessKey, secretKey, region string, useSSL bool, bucket, object string, expiry time.Duration) (string, error) {
	client, err := p.Get(endpoint, accessKey, secretKey, region, useSSL)
	if err != nil {
		return "", err
	}
	u, err := client.PresignedGetObject(ctx, bucket, object, expiry, url.Values{})
	if err != nil {
		return "", fmt.Errorf("presign GET %s/%s: %w", bucket, object, err)
	}
	return u.String(), nil
}

// PresignedPutURL generates a presigned PUT URL using a pooled client for the given endpoint.
func (p *ClientPool) PresignedPutURL(ctx context.Context, endpoint, accessKey, secretKey, region string, useSSL bool, bucket, object string, expiry time.Duration) (string, error) {
	client, err := p.Get(endpoint, accessKey, secretKey, region, useSSL)
	if err != nil {
		return "", err
	}
	u, err := client.PresignedPutObject(ctx, bucket, object, expiry)
	if err != nil {
		return "", fmt.Errorf("presign PUT %s/%s: %w", bucket, object, err)
	}
	return u.String(), nil
}

func newClient(cfg *Config) (*miniogo.Client, error) {
	return miniogo.New(cfg.Endpoint, &miniogo.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
		Region: cfg.Region,
	})
}
