package transaction

import "context"

type Repository interface {
	List(ctx context.Context, userID string, category string, status string) ([]Transaction, error)
	Create(ctx context.Context, tx Transaction) error
	GetSummary(ctx context.Context, userID string) (ExpenseSummaryDTO, error)
}
