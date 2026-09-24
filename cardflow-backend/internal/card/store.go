package card

import (
	"context"
	"errors"
	"time"

	"github.com/bangdinh/go-kit/database/postgres"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// Store implements Repository using PostgreSQL.
type Store struct {
	pool  *pgxpool.Pool
	log   *zap.Logger
	cache *Cache
}

// NewStore creates a new PostgreSQL-backed repository for Card.
func NewStore(pool *pgxpool.Pool, log *zap.Logger, cache *Cache) *Store {
	s := &Store{pool: pool, log: log, cache: cache}
	// Run schema migration & seed in background / startup
	go s.initSchemaAndSeed(context.Background())
	return s
}

func (s *Store) initSchemaAndSeed(ctx context.Context) {
	time.Sleep(500 * time.Millisecond) // wait for pool ready
	schema := `
	CREATE TABLE IF NOT EXISTS cards (
		id TEXT PRIMARY KEY,
		nickname TEXT NOT NULL,
		bank_name TEXT NOT NULL,
		card_type TEXT NOT NULL,
		last_four_digits TEXT NOT NULL,
		card_number_formatted TEXT NOT NULL,
		full_card_number TEXT NOT NULL,
		nfc_id TEXT NOT NULL,
		holder_name TEXT NOT NULL,
		expiry_date TEXT NOT NULL,
		cvv TEXT NOT NULL,
		theme TEXT NOT NULL,
		is_locked BOOLEAN NOT NULL DEFAULT FALSE,
		is_default BOOLEAN NOT NULL DEFAULT FALSE,
		balance BIGINT NOT NULL DEFAULT 0,
		daily_limit BIGINT NOT NULL DEFAULT 0,
		spent_today BIGINT NOT NULL DEFAULT 0,
		online_payment BOOLEAN NOT NULL DEFAULT TRUE,
		international_payment BOOLEAN NOT NULL DEFAULT FALSE,
		atm_withdrawal BOOLEAN NOT NULL DEFAULT TRUE,
		notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
		pin_hash TEXT NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
	`
	_, err := s.pool.Exec(ctx, schema)
	if err != nil {
		s.log.Error("failed to initialize cards schema", zap.Error(err))
		return
	}

	// Check if seeded
	var count int
	err = s.pool.QueryRow(ctx, "SELECT COUNT(*) FROM cards").Scan(&count)
	if err == nil && count == 0 {
		s.log.Info("seeding default cards into PostgreSQL...")
		seeds := []Card{
			{
				ID:                   "card-1",
				Nickname:             "Thẻ Chính Platinum",
				BankName:             "Cardflow Bank",
				CardType:             "VISA PLATINUM",
				LastFourDigits:       "9921",
				CardNumberFormatted:  "•••• •••• •••• 9921",
				FullCardNumber:       "4889 7712 9041 9921",
				NfcID:                "CF-NFC-9921-PL",
				HolderName:           "LÊ HUỲNH THUẬN",
				ExpiryDate:           "09/30",
				CVV:                  "889",
				Theme:                "dark-cyber",
				IsLocked:             false,
				IsDefault:            true,
				Balance:              25500000,
				DailyLimit:           50000000,
				SpentToday:           14250000,
				OnlinePayment:        true,
				InternationalPayment: true,
				AtmWithdrawal:        true,
				NotificationsEnabled: true,
				PinHash:              "123456",
			},
			{
				ID:                   "card-2",
				Nickname:             "Thẻ Chi Tiêu Gold",
				BankName:             "Techcombank",
				CardType:             "MASTERCARD GOLD",
				LastFourDigits:       "8812",
				CardNumberFormatted:  "•••• •••• •••• 8812",
				FullCardNumber:       "5412 8831 2049 8812",
				NfcID:                "CF-NFC-8812-GL",
				HolderName:           "LÊ HUỲNH THUẬN",
				ExpiryDate:           "12/28",
				CVV:                  "452",
				Theme:                "gold-luxe",
				IsLocked:             false,
				IsDefault:            false,
				Balance:              12800000,
				DailyLimit:           30000000,
				SpentToday:           3200000,
				OnlinePayment:        true,
				InternationalPayment: false,
				AtmWithdrawal:        true,
				NotificationsEnabled: true,
				PinHash:              "123456",
			},
			{
				ID:                   "card-3",
				Nickname:             "Thẻ Tiết Kiệm Sapphire",
				BankName:             "Vietcombank",
				CardType:             "VISA SIGNATURE",
				LastFourDigits:       "5566",
				CardNumberFormatted:  "•••• •••• •••• 5566",
				FullCardNumber:       "4111 9012 3341 5566",
				NfcID:                "CF-NFC-5566-SP",
				HolderName:           "LÊ HUỲNH THUẬN",
				ExpiryDate:           "04/29",
				CVV:                  "109",
				Theme:                "deep-sapphire",
				IsLocked:             false,
				IsDefault:            false,
				Balance:              85000000,
				DailyLimit:           100000000,
				SpentToday:           0,
				OnlinePayment:        true,
				InternationalPayment: true,
				AtmWithdrawal:        false,
				NotificationsEnabled: true,
				PinHash:              "123456",
			},
			{
				ID:                   "card-4",
				Nickname:             "Thẻ Doanh Nhân Ruby",
				BankName:             "VPBank",
				CardType:             "JCB ULTIMATE",
				LastFourDigits:       "3340",
				CardNumberFormatted:  "•••• •••• •••• 3340",
				FullCardNumber:       "3782 8224 5510 3340",
				NfcID:                "CF-NFC-3340-RB",
				HolderName:           "LÊ HUỲNH THUẬN",
				ExpiryDate:           "08/27",
				CVV:                  "912",
				Theme:                "crimson-ruby",
				IsLocked:             true,
				IsDefault:            false,
				Balance:              5000000,
				DailyLimit:           20000000,
				SpentToday:           0,
				OnlinePayment:        false,
				InternationalPayment: false,
				AtmWithdrawal:        false,
				NotificationsEnabled: true,
				PinHash:              "123456",
			},
		}

		for _, item := range seeds {
			_ = s.Create(ctx, item)
		}
		s.log.Info("successfully seeded 4 default cards!")
	}
}

// List returns all cards from PostgreSQL.
func (s *Store) List(ctx context.Context) ([]Card, error) {
	db := postgres.GetDBTX(ctx, s.pool)
	rows, err := db.Query(ctx, `
		SELECT id, nickname, bank_name, card_type, last_four_digits, card_number_formatted,
		       full_card_number, nfc_id, holder_name, expiry_date, cvv, theme, is_locked,
		       is_default, balance, daily_limit, spent_today, online_payment, international_payment,
		       atm_withdrawal, notifications_enabled, pin_hash
		FROM cards ORDER BY is_default DESC, created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []Card
	for rows.Next() {
		var c Card
		err := rows.Scan(
			&c.ID, &c.Nickname, &c.BankName, &c.CardType, &c.LastFourDigits, &c.CardNumberFormatted,
			&c.FullCardNumber, &c.NfcID, &c.HolderName, &c.ExpiryDate, &c.CVV, &c.Theme, &c.IsLocked,
			&c.IsDefault, &c.Balance, &c.DailyLimit, &c.SpentToday, &c.OnlinePayment, &c.InternationalPayment,
			&c.AtmWithdrawal, &c.NotificationsEnabled, &c.PinHash,
		)
		if err != nil {
			return nil, err
		}
		cards = append(cards, c)
	}
	return cards, nil
}

// GetByID returns card by ID (with Redis cache).
func (s *Store) GetByID(ctx context.Context, id string) (Card, error) {
	if s.cache != nil {
		if c, ok := s.cache.Get(ctx, id); ok {
			return c, nil
		}
	}

	db := postgres.GetDBTX(ctx, s.pool)
	var c Card
	err := db.QueryRow(ctx, `
		SELECT id, nickname, bank_name, card_type, last_four_digits, card_number_formatted,
		       full_card_number, nfc_id, holder_name, expiry_date, cvv, theme, is_locked,
		       is_default, balance, daily_limit, spent_today, online_payment, international_payment,
		       atm_withdrawal, notifications_enabled, pin_hash
		FROM cards WHERE id = $1
	`, id).Scan(
		&c.ID, &c.Nickname, &c.BankName, &c.CardType, &c.LastFourDigits, &c.CardNumberFormatted,
		&c.FullCardNumber, &c.NfcID, &c.HolderName, &c.ExpiryDate, &c.CVV, &c.Theme, &c.IsLocked,
		&c.IsDefault, &c.Balance, &c.DailyLimit, &c.SpentToday, &c.OnlinePayment, &c.InternationalPayment,
		&c.AtmWithdrawal, &c.NotificationsEnabled, &c.PinHash,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Card{}, errors.New("card not found")
		}
		return Card{}, err
	}

	if s.cache != nil {
		s.cache.Set(ctx, id, c)
	}
	return c, nil
}

// Create inserts a new card into PostgreSQL.
func (s *Store) Create(ctx context.Context, c Card) error {
	db := postgres.GetDBTX(ctx, s.pool)
	_, err := db.Exec(ctx, `
		INSERT INTO cards (
			id, nickname, bank_name, card_type, last_four_digits, card_number_formatted,
			full_card_number, nfc_id, holder_name, expiry_date, cvv, theme, is_locked,
			is_default, balance, daily_limit, spent_today, online_payment, international_payment,
			atm_withdrawal, notifications_enabled, pin_hash, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW()
		)
	`,
		c.ID, c.Nickname, c.BankName, c.CardType, c.LastFourDigits, c.CardNumberFormatted,
		c.FullCardNumber, c.NfcID, c.HolderName, c.ExpiryDate, c.CVV, c.Theme, c.IsLocked,
		c.IsDefault, c.Balance, c.DailyLimit, c.SpentToday, c.OnlinePayment, c.InternationalPayment,
		c.AtmWithdrawal, c.NotificationsEnabled, c.PinHash,
	)
	return err
}

// Update updates an existing card in PostgreSQL and invalidates cache.
func (s *Store) Update(ctx context.Context, c Card) error {
	db := postgres.GetDBTX(ctx, s.pool)
	_, err := db.Exec(ctx, `
		UPDATE cards SET
			nickname = $2, bank_name = $3, card_type = $4, last_four_digits = $5,
			card_number_formatted = $6, full_card_number = $7, nfc_id = $8, holder_name = $9,
			expiry_date = $10, cvv = $11, theme = $12, is_locked = $13, is_default = $14,
			balance = $15, daily_limit = $16, spent_today = $17, online_payment = $18,
			international_payment = $19, atm_withdrawal = $20, notifications_enabled = $21,
			pin_hash = $22, updated_at = NOW()
		WHERE id = $1
	`,
		c.ID, c.Nickname, c.BankName, c.CardType, c.LastFourDigits,
		c.CardNumberFormatted, c.FullCardNumber, c.NfcID, c.HolderName,
		c.ExpiryDate, c.CVV, c.Theme, c.IsLocked, c.IsDefault,
		c.Balance, c.DailyLimit, c.SpentToday, c.OnlinePayment,
		c.InternationalPayment, c.AtmWithdrawal, c.NotificationsEnabled,
		c.PinHash,
	)
	if err == nil && s.cache != nil {
		s.cache.Invalidate(ctx, c.ID)
	}
	return err
}

// Delete removes a card.
func (s *Store) Delete(ctx context.Context, id string) error {
	db := postgres.GetDBTX(ctx, s.pool)
	_, err := db.Exec(ctx, "DELETE FROM cards WHERE id = $1", id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate(ctx, id)
	}
	return err
}
