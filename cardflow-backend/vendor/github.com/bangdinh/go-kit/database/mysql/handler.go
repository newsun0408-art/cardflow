package mysql

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// MySQLHandler wraps *sqlx.DB and implements observability.HealthChecker.
type MySQLHandler interface {
	Check(ctx context.Context) error
	DB() *sqlx.DB
}

type mysqlHandler struct {
	db *sqlx.DB
}

func (h *mysqlHandler) DB() *sqlx.DB { return h.db }

func (h *mysqlHandler) Check(ctx context.Context) error {
	if err := h.db.PingContext(ctx); err != nil {
		return fmt.Errorf("mysql: %w", err)
	}
	return nil
}
