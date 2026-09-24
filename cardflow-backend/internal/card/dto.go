package card

// CardResponse is the public DTO sent to the frontend.
type CardResponse struct {
	ID                   string `json:"id"`
	Nickname             string `json:"nickname"`
	BankName             string `json:"bankName"`
	CardType             string `json:"cardType"`
	LastFourDigits       string `json:"lastFourDigits"`
	CardNumberFormatted  string `json:"cardNumberFormatted"`
	NfcID                string `json:"nfcId"`
	HolderName           string `json:"holderName"`
	ExpiryDate           string `json:"expiryDate"`
	CVV                  string `json:"cvv"`
	Theme                string `json:"theme"`
	IsLocked             bool   `json:"isLocked"`
	IsDefault            bool   `json:"isDefault"`
	Balance              int64  `json:"balance"`
	DailyLimit           int64  `json:"dailyLimit"`
	SpentToday           int64  `json:"spentToday"`
	OnlinePayment        bool   `json:"onlinePayment"`
	InternationalPayment bool   `json:"internationalPayment"`
	AtmWithdrawal        bool   `json:"atmWithdrawal"`
	NotificationsEnabled bool   `json:"notificationsEnabled"`
}

// CreateCardRequest maps input payload for creating a new card.
type CreateCardRequest struct {
	Nickname             string `json:"nickname"`
	BankName             string `json:"bankName"`
	CardType             string `json:"cardType"`
	FullCardNumber       string `json:"fullCardNumber"`
	HolderName           string `json:"holderName"`
	ExpiryDate           string `json:"expiryDate"`
	CVV                  string `json:"cvv"`
	Theme                string `json:"theme"`
	DailyLimit           int64  `json:"dailyLimit"`
	Pin                  string `json:"pin"`
	OnlinePayment        bool   `json:"onlinePayment"`
	InternationalPayment bool   `json:"internationalPayment"`
	AtmWithdrawal        bool   `json:"atmWithdrawal"`
	NotificationsEnabled bool   `json:"notificationsEnabled"`
}

// VerifyPinRequest payload to securely verify card PIN.
type VerifyPinRequest struct {
	CardID string `json:"cardId"`
	Pin    string `json:"pin"`
}

// DecryptedCardData returns the decrypted sensitive card details.
type DecryptedCardData struct {
	FullCardNumber string `json:"fullCardNumber"`
	CVV            string `json:"cvv"`
}

// VerifyPinResponse is returned when authenticating card PIN.
type VerifyPinResponse struct {
	Success          bool               `json:"success"`
	DecryptedData    *DecryptedCardData `json:"decryptedData,omitempty"`
	ExpiresInSeconds int                `json:"expiresInSeconds,omitempty"`
	Error            string             `json:"error,omitempty"`
	AttemptsLeft     int                `json:"attemptsLeft,omitempty"`
}

// ChangePinRequest payload for updating PIN.
type ChangePinRequest struct {
	CardID string `json:"cardId"`
	OldPin string `json:"oldPin"`
	NewPin string `json:"newPin"`
}

// SetLimitRequest payload for adjusting daily limits.
type SetLimitRequest struct {
	CardID     string `json:"cardId"`
	DailyLimit int64  `json:"dailyLimit"`
}

// ToggleLockRequest payload for freezing/unfreezing card.
type ToggleLockRequest struct {
	CardID string `json:"cardId"`
}
