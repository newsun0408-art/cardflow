package card

import "context"

// Repository defines storage operations for Cards.
type Repository interface {
	List(ctx context.Context) ([]Card, error)
	GetByID(ctx context.Context, id string) (Card, error)
	Create(ctx context.Context, c Card) error
	Update(ctx context.Context, c Card) error
	Delete(ctx context.Context, id string) error
}
