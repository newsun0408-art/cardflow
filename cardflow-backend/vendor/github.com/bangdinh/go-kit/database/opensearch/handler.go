package opensearch

import (
	"context"
	"fmt"

	"github.com/opensearch-project/opensearch-go"
)

// OpenSearchHandler wraps *opensearch.Client and implements observability.HealthChecker.
type OpenSearchHandler interface {
	Check(ctx context.Context) error
	Client() *opensearch.Client
}

type openSearchHandler struct {
	client *opensearch.Client
}

func (h *openSearchHandler) Client() *opensearch.Client { return h.client }

func (h *openSearchHandler) Check(_ context.Context) error {
	res, err := h.client.Ping()
	if err != nil {
		return fmt.Errorf("opensearch: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		return fmt.Errorf("opensearch: ping status %s", res.Status())
	}
	return nil
}
