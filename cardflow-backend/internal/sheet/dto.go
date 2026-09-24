package sheet

// CreateSpreadsheetRequest is the payload for creating a new Google Sheet.
type CreateSpreadsheetRequest struct {
	State string `json:"state"`
	Title string `json:"title"`
}

// SpreadsheetResponse represents basic details of a created or fetched spreadsheet.
type SpreadsheetResponse struct {
	SpreadsheetID  string `json:"spreadsheetId"`
	Title          string `json:"title"`
	SpreadsheetURL string `json:"spreadsheetUrl"`
	FolderID       string `json:"folderId,omitempty"`
	FolderName     string `json:"folderName,omitempty"`
}

// AppendRowsRequest is the payload for appending rows of data into a Google Sheet.
type AppendRowsRequest struct {
	State         string          `json:"state"`
	SpreadsheetID string          `json:"spreadsheetId"`
	Range         string          `json:"range"`
	Values        [][]interface{} `json:"values"`
}

// AppendRowsResponse represents the result of an append operation.
type AppendRowsResponse struct {
	SpreadsheetID  string `json:"spreadsheetId"`
	TableRange     string `json:"tableRange,omitempty"`
	UpdatedRange   string `json:"updatedRange,omitempty"`
	UpdatedRows    int64  `json:"updatedRows"`
	UpdatedColumns int64  `json:"updatedColumns"`
	UpdatedCells   int64  `json:"updatedCells"`
}

// ReadRowsResponse represents the retrieved sheet data.
type ReadRowsResponse struct {
	SpreadsheetID string          `json:"spreadsheetId"`
	Range         string          `json:"range"`
	Values        [][]interface{} `json:"values"`
}

// UpdateRowsRequest is the payload for overwriting a specific cell range.
type UpdateRowsRequest struct {
	State         string          `json:"state"`
	SpreadsheetID string          `json:"spreadsheetId"`
	Range         string          `json:"range"`
	Values        [][]interface{} `json:"values"`
}

// ImportSheetRequest is the payload for parsing and importing transactions from a Google Sheet.
type ImportSheetRequest struct {
	State         string `json:"state"`
	SpreadsheetID string `json:"spreadsheetId"` // Supports raw ID or full Google Sheet URL
	Range         string `json:"range,omitempty"`
}

// ParsedTransactionItem represents a single transaction parsed from Google Sheet rows.
type ParsedTransactionItem struct {
	ID            string  `json:"id"`
	ReferenceID   string  `json:"referenceId"`
	Date          string  `json:"date"`
	Time          string  `json:"time"`
	CardLast4     string  `json:"cardLast4"`
	Merchant      string  `json:"merchant"`
	Category      string  `json:"category"`
	CategoryLabel string  `json:"categoryLabel"`
	Amount        float64 `json:"amount"`
	Type          string  `json:"type"` // "expense" | "income"
	Status        string  `json:"status"`
	IsValid       bool    `json:"isValid"`
	ErrorMessage  string  `json:"errorMessage,omitempty"`
}

// ImportSheetResponse represents the parsed sheet data, transaction items, and summary statistics.
type ImportSheetResponse struct {
	SpreadsheetID string                  `json:"spreadsheetId"`
	Title         string                  `json:"title"`
	TotalRows     int                     `json:"totalRows"`
	ValidCount    int                     `json:"validCount"`
	ErrorCount    int                     `json:"errorCount"`
	TotalExpense  float64                 `json:"totalExpense"`
	TotalIncome   float64                 `json:"totalIncome"`
	NetChange     float64                 `json:"netChange"`
	Transactions  []ParsedTransactionItem `json:"transactions"`
}
