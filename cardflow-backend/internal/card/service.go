package card

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"

	
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, userID string) ([]CardDTO, error) {
	cards, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	var res []CardDTO
	for _, c := range cards {
		res = append(res, toDTO(c))
	}
	return res, nil
}

func (s *Service) Create(ctx context.Context, userID string, req CreateCardRequest) (CardDTO, error) {
	if req.CardHolder == "" {
		return CardDTO{}, fmt.Errorf("validation: %s", "cardHolder is required")
	}

	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	num := fmt.Sprintf("4%03d %04d %04d %04d", r.Intn(1000), r.Intn(10000), r.Intn(10000), r.Intn(10000))
	cvv := fmt.Sprintf("%03d", r.Intn(1000))

	c := Card{
		ID:            "card-" + uuid.Must(uuid.NewV7()).String()[:8],
		UserID:        userID,
		CardNumber:    num,
		CardHolder:    req.CardHolder,
		Expiry:        "12/29",
		CVV:           cvv,
		Balance:       0,
		Currency:      "VND",
		CardType:      req.CardType,
		Status:        "ACTIVE",
		SpendingLimit: req.SpendingLimit,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	if c.SpendingLimit <= 0 {
		c.SpendingLimit = 50000000
	}
	if c.CardType == "" {
		c.CardType = "BLACK_TITANIUM"
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return CardDTO{}, err
	}
	return toDTO(c), nil
}

func (s *Service) UpdateStatus(ctx context.Context, id string, status string) error {
	if status != "ACTIVE" && status != "LOCKED" {
		return fmt.Errorf("validation: %s", "status must be ACTIVE or LOCKED")
	}
	return s.repo.UpdateStatus(ctx, id, status)
}

func toDTO(c Card) CardDTO {
	return CardDTO{
		ID:            c.ID,
		UserID:        c.UserID,
		CardNumber:    c.CardNumber,
		CardHolder:    c.CardHolder,
		Expiry:        c.Expiry,
		Balance:       c.Balance,
		Currency:      c.Currency,
		CardType:      c.CardType,
		Status:        c.Status,
		SpendingLimit: c.SpendingLimit,
	}
}
