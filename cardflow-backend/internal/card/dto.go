package card

type CardDTO struct {
	ID            string  `json:"id"`
	UserID        string  `json:"userId"`
	CardNumber    string  `json:"cardNumber"`
	CardHolder    string  `json:"cardHolder"`
	Expiry        string  `json:"expiry"`
	Balance       float64 `json:"balance"`
	Currency      string  `json:"currency"`
	CardType      string  `json:"cardType"`
	Status        string  `json:"status"`
	SpendingLimit float64 `json:"spendingLimit"`
}

type CreateCardRequest struct {
	CardHolder    string  `json:"cardHolder"`
	CardType      string  `json:"cardType"`
	SpendingLimit float64 `json:"spendingLimit"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}
