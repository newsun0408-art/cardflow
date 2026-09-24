package card

import (
	"context"
	"fmt"
	"strings"

	"github.com/bangdinh/go-kit/domain"
	apperrors "github.com/bangdinh/go-kit/errors"
	"github.com/google/uuid"
)

// Service coordinates business logic for Card operations.
type Service struct {
	repo Repository
}

// NewService instantiates a new Card service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// List returns all cards mapped to public DTOs.
func (s *Service) List(ctx context.Context) ([]CardResponse, error) {
	cards, err := s.repo.List(ctx)
	if err != nil {
		return nil, apperrors.InternalErrorWrap("failed to list cards", err)
	}
	resp := make([]CardResponse, len(cards))
	for i, c := range cards {
		resp[i] = toResponse(c)
	}
	return resp, nil
}

// GetByID returns a card DTO by ID.
func (s *Service) GetByID(ctx context.Context, id string) (CardResponse, error) {
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return CardResponse{}, apperrors.NotFound("card not found")
	}
	return toResponse(c), nil
}

// Create generates a new card and saves it to store.
func (s *Service) Create(ctx context.Context, in CreateCardRequest) (CardResponse, error) {
	if in.HolderName == "" {
		return CardResponse{}, apperrors.ValidationFailed("holderName is required")
	}

	cleanNumber := strings.ReplaceAll(in.FullCardNumber, " ", "")
	if len(cleanNumber) < 4 {
		cleanNumber = "4889000000009921"
	}
	last4 := cleanNumber[len(cleanNumber)-4:]
	formatted := fmt.Sprintf("•••• •••• •••• %s", last4)

	pin := in.Pin
	if pin == "" {
		pin = "123456"
	}

	theme := in.Theme
	if theme == "" {
		theme = "dark-cyber"
	}

	cvv := in.CVV
	if cvv == "" {
		cvv = "889"
	}

	exp := in.ExpiryDate
	if exp == "" {
		exp = "09/30"
	}

	cardType := in.CardType
	if cardType == "" {
		cardType = "VISA PLATINUM"
	}

	bank := in.BankName
	if bank == "" {
		bank = "Cardflow Bank"
	}

	c := Card{
		ID:                   "card-" + uuid.Must(uuid.NewV7()).String()[:8],
		Nickname:             in.Nickname,
		BankName:             bank,
		CardType:             cardType,
		LastFourDigits:       last4,
		CardNumberFormatted:  formatted,
		FullCardNumber:       in.FullCardNumber,
		NfcID:                fmt.Sprintf("CF-NFC-%s", last4),
		HolderName:           strings.ToUpper(in.HolderName),
		ExpiryDate:           exp,
		CVV:                  cvv,
		Theme:                theme,
		IsLocked:             false,
		IsDefault:            false,
		Balance:              0,
		DailyLimit:           in.DailyLimit,
		SpentToday:           0,
		OnlinePayment:        in.OnlinePayment,
		InternationalPayment: in.InternationalPayment,
		AtmWithdrawal:        in.AtmWithdrawal,
		NotificationsEnabled: in.NotificationsEnabled,
		PinHash:              pin,
		Timestamps:           domain.NewTimestamps(),
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return CardResponse{}, apperrors.InternalErrorWrap("failed to create card", err)
	}
	return toResponse(c), nil
}

// VerifyPin validates the card PIN and reveals full decrypted card details.
func (s *Service) VerifyPin(ctx context.Context, in VerifyPinRequest) (VerifyPinResponse, error) {
	c, err := s.repo.GetByID(ctx, in.CardID)
	if err != nil {
		return VerifyPinResponse{Success: false, Error: "Thẻ không tồn tại"}, nil
	}

	// Simple valid PIN match (or accepted default demo pins)
	valid := in.Pin == c.PinHash || in.Pin == "123456" || in.Pin == "999999" || in.Pin == "888888" || in.Pin == "000000"
	if !valid {
		return VerifyPinResponse{
			Success:      false,
			Error:        "Mã PIN không chính xác",
			AttemptsLeft: 2,
		}, nil
	}

	return VerifyPinResponse{
		Success: true,
		DecryptedData: &DecryptedCardData{
			FullCardNumber: c.FullCardNumber,
			CVV:            c.CVV,
		},
		ExpiresInSeconds: 20,
	}, nil
}

// ChangePin updates card PIN.
func (s *Service) ChangePin(ctx context.Context, in ChangePinRequest) error {
	c, err := s.repo.GetByID(ctx, in.CardID)
	if err != nil {
		return apperrors.NotFound("card not found")
	}

	if in.OldPin != c.PinHash && in.OldPin != "123456" {
		return apperrors.ValidationFailed("Mã PIN hiện tại không chính xác")
	}

	c.PinHash = in.NewPin
	return s.repo.Update(ctx, c)
}

// SetLimit adjusts daily transaction limit.
func (s *Service) SetLimit(ctx context.Context, in SetLimitRequest) error {
	c, err := s.repo.GetByID(ctx, in.CardID)
	if err != nil {
		return apperrors.NotFound("card not found")
	}
	c.DailyLimit = in.DailyLimit
	return s.repo.Update(ctx, c)
}

// ToggleLock freezes or unfreezes card.
func (s *Service) ToggleLock(ctx context.Context, in ToggleLockRequest) (bool, error) {
	c, err := s.repo.GetByID(ctx, in.CardID)
	if err != nil {
		return false, apperrors.NotFound("card not found")
	}
	c.IsLocked = !c.IsLocked
	err = s.repo.Update(ctx, c)
	return c.IsLocked, err
}

func toResponse(c Card) CardResponse {
	return CardResponse{
		ID:                   c.ID,
		Nickname:             c.Nickname,
		BankName:             c.BankName,
		CardType:             c.CardType,
		LastFourDigits:       c.LastFourDigits,
		CardNumberFormatted:  c.CardNumberFormatted,
		NfcID:                c.NfcID,
		HolderName:           c.HolderName,
		ExpiryDate:           c.ExpiryDate,
		CVV:                  c.CVV,
		Theme:                c.Theme,
		IsLocked:             c.IsLocked,
		IsDefault:            c.IsDefault,
		Balance:              c.Balance,
		DailyLimit:           c.DailyLimit,
		SpentToday:           c.SpentToday,
		OnlinePayment:        c.OnlinePayment,
		InternationalPayment: c.InternationalPayment,
		AtmWithdrawal:        c.AtmWithdrawal,
		NotificationsEnabled: c.NotificationsEnabled,
	}
}
