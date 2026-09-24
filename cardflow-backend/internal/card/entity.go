package card

import (
	"github.com/bangdinh/go-kit/domain"
)

// Card represents the core financial card entity in Cardflow.
type Card struct {
	ID                   string `json:"id"`
	Nickname             string `json:"nickname"`
	BankName             string `json:"bankName"`
	CardType             string `json:"cardType"`
	LastFourDigits       string `json:"lastFourDigits"`
	CardNumberFormatted  string `json:"cardNumberFormatted"`
	FullCardNumber       string `json:"fullCardNumber"`
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
	PinHash              string `json:"pinHash"`
	domain.Timestamps
}
