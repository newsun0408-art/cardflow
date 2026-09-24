package domain

import "context"

// UnitOfWork abstracts a transactional boundary.
// The domain layer defines this interface; the infra layer implements it
// (e.g. wrapping a SQL *sql.Tx or a Mongo session).
//
// Begin returns a new context carrying the transaction. Repositories
// extract the transaction from this context to participate in it.
type UnitOfWork interface {
	Begin(ctx context.Context) (context.Context, error)
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}

// RunInTx executes fn inside a transaction managed by uow.
//   - On fn success → Commit (returns commit error if any).
//   - On fn error   → Rollback, return fn's error.
//   - On Begin error → return immediately, fn is never called.
func RunInTx(ctx context.Context, uow UnitOfWork, fn func(ctx context.Context) error) error {
	txCtx, err := uow.Begin(ctx)
	if err != nil {
		return err
	}

	if err := fn(txCtx); err != nil {
		_ = uow.Rollback(txCtx)
		return err
	}

	return uow.Commit(txCtx)
}
