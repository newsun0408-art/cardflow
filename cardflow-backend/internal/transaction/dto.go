package transaction

type TransactionDTO struct {
	ID        string  `json:"id"`
	CardID    string  `json:"cardId"`
	Title     string  `json:"title"`
	Amount    float64 `json:"amount"`
	Type      string  `json:"type"`
	Category  string  `json:"category"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"createdAt"`
}

type CreateTransactionRequest struct {
	CardID   string  `json:"cardId"`
	Title    string  `json:"title"`
	Amount   float64 `json:"amount"`
	Type     string  `json:"type"`     // 'EXPENSE' or 'INCOME'
	Category string  `json:"category"` // 'TECHNOLOGY', 'FOOD', 'TRANSPORT', 'HOUSING', 'OTHER'
	Note     string  `json:"note"`
}

type CategoryBreakdownDTO struct {
	Category   string  `json:"category"`
	Name       string  `json:"name"`
	Amount     float64 `json:"amount"`
	Percentage int     `json:"percentage"`
	Color      string  `json:"color"`
}

type ExpenseSummaryDTO struct {
	TotalIncome  float64                `json:"totalIncome"`
	TotalExpense float64                `json:"totalExpense"`
	SavingsRate  float64                `json:"savingsRate"`
	Breakdown    []CategoryBreakdownDTO `json:"breakdown"`
}
