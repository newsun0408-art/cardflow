package card

import (
	"fmt"
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	
)

type Store struct {
	pool *pgxpool.Pool
	log  *zap.Logger
}

func NewStore(pool *pgxpool.Pool, log *zap.Logger) Repository {
	return &Store{pool: pool, log: log}
}

func (s *Store) ListByUserID(ctx context.Context, userID string) ([]Card, error) {
	rows, err := s.pool.Query(ctx, "SELECT id, user_id, card_number, card_holder, expiry, cvv, balance, currency, card_type, status, spending_limit, created_at, updated_at FROM cards WHERE user_id=$1 ORDER BY created_at ASC", userID)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", "query cards failed", err)
	}
	defer rows.Close()

	var list []Card
	for rows.Next() {
		var c Card
		if err := rows.Scan(&c.ID, &c.UserID, &c.CardNumber, &c.CardHolder, &c.Expiry, &c.CVV, &c.Balance, &c.Currency, &c.CardType, &c.Status, &c.SpendingLimit, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("%s: %w", "scan card failed", err)
		}
		list = append(list, c)
	}
	return list, nil
}

func (s *Store) GetByID(ctx context.Context, id string) (Card, error) {
	var c Card
	err := s.pool.QueryRow(ctx, "SELECT id, user_id, card_number, card_holder, expiry, cvv, balance, currency, card_type, status, spending_limit, created_at, updated_at FROM cards WHERE id=$1", id).
		Scan(&c.ID, &c.UserID, &c.CardNumber, &c.CardHolder, &c.Expiry, &c.CVV, &c.Balance, &c.Currency, &c.CardType, &c.Status, &c.SpendingLimit, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Card{}, fmt.Errorf("not found: %s", "card not found")
	}
	if err != nil {
		return Card{}, fmt.Errorf("%s: %w", "query card failed", err)
	}
	return c, nil
}

func (s *Store) Create(ctx context.Context, c Card) error {
	_, err := s.pool.Exec(ctx,
		"INSERT INTO cards (id, user_id, card_number, card_holder, expiry, cvv, balance, currency, card_type, status, spending_limit, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
		c.ID, c.UserID, c.CardNumber, c.CardHolder, c.Expiry, c.CVV, c.Balance, c.Currency, c.CardType, c.Status, c.SpendingLimit, c.CreatedAt, c.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("%s: %w", "insert card failed", err)
	}
	return nil
}

func (s *Store) UpdateStatus(ctx context.Context, id string, status string) error {
	res, err := s.pool.Exec(ctx, "UPDATE cards SET status=$1, updated_at=$2 WHERE id=$3", status, time.Now(), id)
	if err != nil {
		return fmt.Errorf("%s: %w", "update card status failed", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("not found: %s", "card not found")
	}
	return nil
}
