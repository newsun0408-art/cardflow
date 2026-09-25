package transaction

import (
	"fmt"
	"context"
	"math"

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

func (s *Store) List(ctx context.Context, userID string, category string, status string) ([]Transaction, error) {
	query := "SELECT id, card_id, user_id, title, amount, type, category, status, COALESCE(note, ''), created_at, updated_at FROM transactions WHERE user_id=$1"
	args := []any{userID}

	if category != "" && category != "ALL" {
		args = append(args, category)
		query += " AND category=$" + string(rune('0'+len(args)))
	}
	if status != "" && status != "ALL" {
		args = append(args, status)
		query += " AND status=$" + string(rune('0'+len(args)))
	}
	query += " ORDER BY created_at DESC"

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", "query transactions failed", err)
	}
	defer rows.Close()

	var list []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.CardID, &t.UserID, &t.Title, &t.Amount, &t.Type, &t.Category, &t.Status, &t.Note, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, fmt.Errorf("%s: %w", "scan transaction failed", err)
		}
		list = append(list, t)
	}
	return list, nil
}

func (s *Store) Create(ctx context.Context, tx Transaction) error {
	_, err := s.pool.Exec(ctx,
		"INSERT INTO transactions (id, card_id, user_id, title, amount, type, category, status, note, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
		tx.ID, tx.CardID, tx.UserID, tx.Title, tx.Amount, tx.Type, tx.Category, tx.Status, tx.Note, tx.CreatedAt, tx.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("%s: %w", "insert transaction failed", err)
	}
	return nil
}

func (s *Store) GetSummary(ctx context.Context, userID string) (ExpenseSummaryDTO, error) {
	var totalIncome, totalExpense float64

	// 1. Total Income
	_ = s.pool.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id=$1 AND type='INCOME' AND status='SUCCESS'", userID).Scan(&totalIncome)
	// 2. Total Expense
	_ = s.pool.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id=$1 AND type='EXPENSE' AND status='SUCCESS'", userID).Scan(&totalExpense)

	var savingsRate float64
	if totalIncome > 0 {
		savingsRate = math.Round(((totalIncome-totalExpense)/totalIncome)*1000) / 10
		if savingsRate < 0 {
			savingsRate = 0
		}
	}

	// 3. Category Breakdown for Expenses
	rows, err := s.pool.Query(ctx, "SELECT category, COALESCE(SUM(amount), 0) as cat_amount FROM transactions WHERE user_id=$1 AND type='EXPENSE' AND status='SUCCESS' GROUP BY category ORDER BY cat_amount DESC", userID)
	if err != nil {
		return ExpenseSummaryDTO{}, fmt.Errorf("%s: %w", "query expense breakdown failed", err)
	}
	defer rows.Close()

	catMap := map[string]string{
		"TECHNOLOGY": "Công nghệ",
		"FOOD":       "Ăn uống",
		"TRANSPORT":  "Di chuyển",
		"HOUSING":    "Nhà cửa",
		"OTHER":      "Còn lại",
	}
	colorMap := map[string]string{
		"TECHNOLOGY": "#00f0ff",
		"FOOD":       "#f59e0b",
		"TRANSPORT":  "#a855f7",
		"HOUSING":    "#10b981",
		"OTHER":      "#64748b",
	}

	var breakdown []CategoryBreakdownDTO
	for rows.Next() {
		var cat string
		var amt float64
		if err := rows.Scan(&cat, &amt); err != nil {
			continue
		}
		pct := 0
		if totalExpense > 0 {
			pct = int(math.Round((amt / totalExpense) * 100))
		}
		displayName, ok := catMap[cat]
		if !ok {
			displayName = cat
		}
		color, ok := colorMap[cat]
		if !ok {
			color = "#00f0ff"
		}
		breakdown = append(breakdown, CategoryBreakdownDTO{
			Category:   cat,
			Name:       displayName,
			Amount:     amt,
			Percentage: pct,
			Color:      color,
		})
	}

	return ExpenseSummaryDTO{
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		SavingsRate:  savingsRate,
		Breakdown:    breakdown,
	}, nil
}
