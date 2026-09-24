package mongo

import (
	"context"
	"fmt"

	mongodrv "go.mongodb.org/mongo-driver/mongo"
)

// MongoHandler wraps *mongo.Client and implements observability.HealthChecker.
type MongoHandler interface {
	Check(ctx context.Context) error
	Client() *mongodrv.Client
}

type mongoHandler struct {
	client *mongodrv.Client
}

func (h *mongoHandler) Client() *mongodrv.Client { return h.client }

func (h *mongoHandler) Check(ctx context.Context) error {
	if err := h.client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("mongo: %w", err)
	}
	return nil
}
