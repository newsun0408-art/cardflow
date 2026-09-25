package card

import (
	"time"
)

type Card struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	CardNumber    string    `json:"card_number"`
	CardHolder    string    `json:"card_holder"`
	Expiry        string    `json:"expiry"`
	CVV           string    `json:"cvv"`
	Balance       float64   `json:"balance"`
	Currency      string    `json:"currency"`
	CardType      string    `json:"card_type"`
	Status        string    `json:"status"`
	SpendingLimit float64   `json:"spending_limit"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
