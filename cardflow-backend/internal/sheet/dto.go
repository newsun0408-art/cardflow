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

// CardItemDTO represents card details for Google Sheet export.
type CardItemDTO struct {
	ID                string `json:"id"`
	Nickname          string `json:"nickname"`
	BankName          string `json:"bankName"`
	CardType          string `json:"cardType"`
	CardCategory      string `json:"cardCategory"`
	CardNetwork       string `json:"cardNetwork"`
	CardNumber        string `json:"cardNumber"`
	HolderName        string `json:"holderName"`
	ExpiryOrIssueDate string `json:"expiryOrIssueDate"`
	CVV               string `json:"cvv,omitempty"`
	Balance           int64  `json:"balance"`
	DailyLimit        int64  `json:"dailyLimit"`
	Status            string `json:"status"`
}

// SaveCardsRequest is the payload for saving card records into a Google Sheet.
type SaveCardsRequest struct {
	State string        `json:"state"`
	Cards []CardItemDTO `json:"cards"`
}

// SaveCardsResponse holds the outcome of saving cards into Google Sheet.
type SaveCardsResponse struct {
	SpreadsheetID  string `json:"spreadsheetId"`
	SpreadsheetURL string `json:"spreadsheetUrl"`
	FolderID       string `json:"folderId"`
	FolderName     string `json:"folderName"`
	SavedCards     int    `json:"savedCards"`
	Message        string `json:"message"`
}

