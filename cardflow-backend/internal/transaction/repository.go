package transaction

import "context"

type Repository interface {
	List(ctx context.Context, userID string, category string, status string) ([]Transaction, error)
	GetByID(ctx context.Context, userID string, id string) (*Transaction, error)
	Create(ctx context.Context, tx Transaction) error
	Update(ctx context.Context, userID string, id string, tx Transaction) error
	Delete(ctx context.Context, userID string, id string) error
	GetSummary(ctx context.Context, userID string) (ExpenseSummaryDTO, error)
}
