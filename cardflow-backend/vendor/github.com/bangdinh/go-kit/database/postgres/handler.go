package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresHandler wraps *pgxpool.Pool and implements observability.HealthChecker.
type PostgresHandler interface {
	Check(ctx context.Context) error
	Pool() *pgxpool.Pool
}

type postgresHandler struct {
	pool *pgxpool.Pool
}

func (h *postgresHandler) Pool() *pgxpool.Pool { return h.pool }

func (h *postgresHandler) Check(ctx context.Context) error {
	if err := h.pool.Ping(ctx); err != nil {
		return fmt.Errorf("postgres: %w", err)
	}
	return nil
}
