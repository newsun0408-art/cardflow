package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DBTX is an abstraction over *pgxpool.Pool, *pgxpool.Conn, and pgx.Tx.
// Repositories can accept DBTX or use GetDBTX(ctx, pool) to seamlessly
// execute queries inside or outside a database transaction.
type DBTX interface {
	Exec(ctx context.Context, sql string, arguments ...any) (commandTag pgconn.CommandTag, err error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	CopyFrom(ctx context.Context, tableName pgx.Identifier, columnNames []string, rowSrc pgx.CopyFromSource) (int64, error)
	SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults
}

type txCtxKey struct{}

// WithTx returns a new context containing the given pgx.Tx.
func WithTx(ctx context.Context, tx pgx.Tx) context.Context {
	return context.WithValue(ctx, txCtxKey{}, tx)
}

// ExtractTx retrieves the active pgx.Tx from the context if one exists.
func ExtractTx(ctx context.Context) (pgx.Tx, bool) {
	tx, ok := ctx.Value(txCtxKey{}).(pgx.Tx)
	return tx, ok
}

// GetDBTX returns the active pgx.Tx from context if available,
// otherwise falls back to the provided *pgxpool.Pool.
func GetDBTX(ctx context.Context, pool *pgxpool.Pool) DBTX {
	if tx, ok := ExtractTx(ctx); ok {
		return tx
	}
	if pool == nil {
		return nil
	}
	return pool
}

// Transactor defines the interface for running operations in a transaction.
type Transactor interface {
	RunInTx(ctx context.Context, fn func(txCtx context.Context) error) error
}

type poolTransactor struct {
	pool *pgxpool.Pool
}

// NewTransactor creates a new Transactor instance for a pgxpool.Pool.
func NewTransactor(pool *pgxpool.Pool) Transactor {
	return &poolTransactor{pool: pool}
}

func (t *poolTransactor) RunInTx(ctx context.Context, fn func(txCtx context.Context) error) error {
	return RunInTx(ctx, t.pool, fn)
}

// RunInTx executes fn inside a PostgreSQL transaction using pool.
// - If fn succeeds -> commits transaction.
// - If fn returns an error -> rolls back transaction and returns the error.
// - If fn panics -> rolls back transaction and re-panics.
// - If a transaction already exists in ctx -> reuses existing transaction (nested call).
func RunInTx(ctx context.Context, pool *pgxpool.Pool, fn func(txCtx context.Context) error) (err error) {
	if _, ok := ExtractTx(ctx); ok {
		// Already in a transaction, continue with current context
		return fn(ctx)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("postgres: begin tx: %w", err)
	}

	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback(ctx)
			panic(r)
		}
	}()

	txCtx := WithTx(ctx, tx)
	if err := fn(txCtx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil && rbErr != pgx.ErrTxClosed {
			return fmt.Errorf("postgres: tx error: %w, rollback error: %v", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("postgres: commit tx: %w", err)
	}

	return nil
}
