package transaction

import (
	"fmt"
	"context"
	"time"

	"github.com/google/uuid"

	
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, userID string, category string, status string) ([]TransactionDTO, error) {
	txs, err := s.repo.List(ctx, userID, category, status)
	if err != nil {
		return nil, err
	}
	var res []TransactionDTO
	for _, t := range txs {
		res = append(res, toDTO(t))
	}
	return res, nil
}

func (s *Service) Create(ctx context.Context, userID string, req CreateTransactionRequest) (TransactionDTO, error) {
	if req.Title == "" {
		return TransactionDTO{}, fmt.Errorf("validation: %s", "title is required")
	}
	if req.Amount <= 0 {
		return TransactionDTO{}, fmt.Errorf("validation: %s", "amount must be greater than 0")
	}
	if req.Type == "" {
		req.Type = "EXPENSE"
	}
	if req.Category == "" {
		req.Category = "OTHER"
	}

	t := Transaction{
		ID:        "tx-" + uuid.Must(uuid.NewV7()).String()[:8],
		CardID:    req.CardID,
		UserID:    userID,
		Title:     req.Title,
		Amount:    req.Amount,
		Type:      req.Type,
		Category:  req.Category,
		Status:    "SUCCESS",
		Note:      req.Note,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.Create(ctx, t); err != nil {
		return TransactionDTO{}, err
	}
	return toDTO(t), nil
}

func (s *Service) Update(ctx context.Context, userID string, id string, req UpdateTransactionRequest) (TransactionDTO, error) {
	existing, err := s.repo.GetByID(ctx, userID, id)
	if err != nil {
		return TransactionDTO{}, fmt.Errorf("transaction not found: %w", err)
	}
	if req.Title != "" {
		existing.Title = req.Title
	}
	if req.Amount > 0 {
		existing.Amount = req.Amount
	}
	if req.CardID != "" {
		existing.CardID = req.CardID
	}
	if req.Type != "" {
		existing.Type = req.Type
	}
	if req.Category != "" {
		existing.Category = req.Category
	}
	if req.Status != "" {
		existing.Status = req.Status
	}
	if req.Note != "" {
		existing.Note = req.Note
	}
	existing.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, userID, id, *existing); err != nil {
		return TransactionDTO{}, err
	}
	return toDTO(*existing), nil
}

func (s *Service) Delete(ctx context.Context, userID string, id string) error {
	return s.repo.Delete(ctx, userID, id)
}

func (s *Service) GetSummary(ctx context.Context, userID string) (ExpenseSummaryDTO, error) {
	return s.repo.GetSummary(ctx, userID)
}

func toDTO(t Transaction) TransactionDTO {
	return TransactionDTO{
		ID:        t.ID,
		CardID:    t.CardID,
		Title:     t.Title,
		Amount:    t.Amount,
		Type:      t.Type,
		Category:  t.Category,
		Status:    t.Status,
		CreatedAt: t.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}
