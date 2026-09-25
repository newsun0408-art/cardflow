package transaction

import "time"

type Transaction struct {
	ID        string    `json:"id"`
	CardID    string    `json:"card_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"`     // 'EXPENSE' or 'INCOME'
	Category  string    `json:"category"` // 'TECHNOLOGY', 'FOOD', 'TRANSPORT', 'HOUSING', 'OTHER'
	Status    string    `json:"status"`   // 'SUCCESS', 'PENDING', 'FAILED'
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
