package card

import "context"

type Repository interface {
	ListByUserID(ctx context.Context, userID string) ([]Card, error)
	GetByID(ctx context.Context, id string) (Card, error)
	Create(ctx context.Context, c Card) error
	UpdateStatus(ctx context.Context, id string, status string) error
}
