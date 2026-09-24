package sheet

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	drivefeat "github.com/bangdinh/cardflow-backend/internal/drive"
	"google.golang.org/api/sheets/v4"
)

// Service provides Google Sheets business operations.
type Service struct {
	repo drivefeat.Repository
}

// NewService creates a new Google Sheets service.
func NewService(repo drivefeat.Repository) *Service {
	return &Service{repo: repo}
}

var sheetURLRegex = regexp.MustCompile(`/spreadsheets/d/([a-zA-Z0-9-_]+)`)

// ExtractSpreadsheetID extracts the raw spreadsheet ID from a full Google Sheets URL or returns the clean ID.
func ExtractSpreadsheetID(input string) string {
	input = strings.TrimSpace(input)
	if m := sheetURLRegex.FindStringSubmatch(input); len(m) > 1 {
		return m[1]
	}
	if strings.Contains(input, "id=") {
		parts := strings.Split(input, "id=")
		if len(parts) > 1 {
			id := parts[1]
			if idx := strings.IndexAny(id, "&/?#"); idx != -1 {
				id = id[:idx]
			}
			return strings.TrimSpace(id)
		}
	}
	input = strings.TrimPrefix(input, "https://")
	input = strings.TrimPrefix(input, "http://")
	return input
}

// resolveRange ensures the range maps to a valid sheet in the spreadsheet.
// If the sheet name does not exist (e.g. requested "Sheet1!A1" but account language created "Trang tính 1"),
// or if no sheet name was provided (e.g. "A1"), it automatically resolves to the first sheet.
func resolveRange(ctx context.Context, srv *sheets.Service, spreadsheetID, targetRange string) string {
	targetRange = strings.TrimSpace(targetRange)
	if srv == nil {
		if targetRange == "" {
			return "Sheet1"
		}
		return targetRange
	}
	ss, err := srv.Spreadsheets.Get(spreadsheetID).Fields("sheets(properties(title))").Context(ctx).Do()

	if err == nil && len(ss.Sheets) > 0 {
		firstSheet := ss.Sheets[0].Properties.Title
		quoteTitle := func(t string) string {
			if strings.Contains(t, " ") || strings.Contains(t, "'") {
				return fmt.Sprintf("'%s'", strings.ReplaceAll(t, "'", "''"))
			}
			return t
		}

		if strings.Contains(targetRange, "!") {
			parts := strings.SplitN(targetRange, "!", 2)
			sheetName := strings.Trim(parts[0], "'")
			cellRange := parts[1]

			for _, sh := range ss.Sheets {
				if strings.EqualFold(sh.Properties.Title, sheetName) {
					return fmt.Sprintf("%s!%s", quoteTitle(sh.Properties.Title), cellRange)
				}
			}
			// If requested sheet name is not found, fallback to first sheet
			return fmt.Sprintf("%s!%s", quoteTitle(firstSheet), cellRange)
		}

		if targetRange == "" {
			return quoteTitle(firstSheet)
		}
		return fmt.Sprintf("%s!%s", quoteTitle(firstSheet), targetRange)
	}

	if targetRange == "" {
		return "Sheet1"
	}
	return targetRange
}

// CreateSpreadsheet creates a new Google Sheet on behalf of the authorized user.
func (s *Service) CreateSpreadsheet(ctx context.Context, state, title string) (SpreadsheetResponse, error) {
	if state == "" {
		return SpreadsheetResponse{}, errors.New("state is required")
	}
	title = strings.TrimSpace(title)
	if title == "" {
		title = "Untitled Spreadsheet"
	}

	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		return SpreadsheetResponse{}, errors.New("Google account is not connected for this state")
	}

	srv, err := newSheetsService(ctx, tok)
	if err != nil {
		return SpreadsheetResponse{}, fmt.Errorf("init sheets client failed: %w", err)
	}

	ss := &sheets.Spreadsheet{
		Properties: &sheets.SpreadsheetProperties{
			Title: title,
		},
		Sheets: []*sheets.Sheet{
			{
				Properties: &sheets.SheetProperties{
					Title: "Sheet1",
				},
			},
		},
	}
	res, err := srv.Spreadsheets.Create(ss).Context(ctx).Do()
	if err != nil {
		return SpreadsheetResponse{}, fmt.Errorf("create spreadsheet failed: %w", err)
	}

	var folderID string
	ds, err := drivefeat.NewDriveService(ctx, tok)
	if err == nil {
		fID, fErr := drivefeat.EnsureFolder(ctx, ds, drivefeat.CardFlowFolderName)
		if fErr == nil {
			folderID = fID
			_ = s.repo.SaveFolderID(ctx, state, folderID)
			// Move the created spreadsheet into the CardFlow folder
			_, _ = ds.Files.Update(res.SpreadsheetId, nil).
				AddParents(folderID).
				RemoveParents("root").
				Context(ctx).
				Do()

			// Register in imported files store
			newFile := drivefeat.DriveFile{
				ID:         res.SpreadsheetId,
				Name:       res.Properties.Title,
				MimeType:   "application/vnd.google-apps.spreadsheet",
				WebViewURL: res.SpreadsheetUrl,
			}
			if existing, ok := s.repo.GetImportedFiles(ctx, state); ok {
				_ = s.repo.SaveImportedFiles(ctx, state, append(existing, newFile))
			} else {
				_ = s.repo.SaveImportedFiles(ctx, state, []drivefeat.DriveFile{newFile})
			}
		}
	}

	return SpreadsheetResponse{
		SpreadsheetID:  res.SpreadsheetId,
		Title:          res.Properties.Title,
		SpreadsheetURL: res.SpreadsheetUrl,
		FolderID:       folderID,
		FolderName:     drivefeat.CardFlowFolderName,
	}, nil
}

// ReadRows reads cell values from a specified range in a spreadsheet.
func (s *Service) ReadRows(ctx context.Context, state, spreadsheetID, readRange string) (ReadRowsResponse, error) {
	if state == "" {
		return ReadRowsResponse{}, errors.New("state is required")
	}
	if spreadsheetID == "" {
		return ReadRowsResponse{}, errors.New("spreadsheetId is required")
	}

	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		return ReadRowsResponse{}, errors.New("Google account is not connected for this state")
	}

	srv, err := newSheetsService(ctx, tok)
	if err != nil {
		return ReadRowsResponse{}, fmt.Errorf("init sheets client failed: %w", err)
	}

	resolvedRange := resolveRange(ctx, srv, spreadsheetID, readRange)
	res, err := srv.Spreadsheets.Values.Get(spreadsheetID, resolvedRange).Context(ctx).Do()
	if err != nil {
		return ReadRowsResponse{}, fmt.Errorf("read rows failed: %w", err)
	}

	return ReadRowsResponse{
		SpreadsheetID: spreadsheetID,
		Range:         res.Range,
		Values:        res.Values,
	}, nil
}

// AppendRows appends rows of data to the end of a sheet or specified range.
func (s *Service) AppendRows(ctx context.Context, state, spreadsheetID, appendRange string, values [][]interface{}) (AppendRowsResponse, error) {
	if state == "" {
		return AppendRowsResponse{}, errors.New("state is required")
	}
	if spreadsheetID == "" {
		return AppendRowsResponse{}, errors.New("spreadsheetId is required")
	}
	if len(values) == 0 {
		return AppendRowsResponse{}, errors.New("values cannot be empty")
	}

	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		return AppendRowsResponse{}, errors.New("Google account is not connected for this state")
	}

	srv, err := newSheetsService(ctx, tok)
	if err != nil {
		return AppendRowsResponse{}, fmt.Errorf("init sheets client failed: %w", err)
	}

	resolvedRange := resolveRange(ctx, srv, spreadsheetID, appendRange)
	vr := &sheets.ValueRange{
		Values: values,
	}
	res, err := srv.Spreadsheets.Values.Append(spreadsheetID, resolvedRange, vr).
		ValueInputOption("USER_ENTERED").
		Context(ctx).
		Do()
	if err != nil {
		return AppendRowsResponse{}, fmt.Errorf("append rows failed: %w", err)
	}

	resp := AppendRowsResponse{
		SpreadsheetID: spreadsheetID,
		TableRange:    res.TableRange,
	}
	if res.Updates != nil {
		resp.UpdatedRange = res.Updates.UpdatedRange
		resp.UpdatedRows = res.Updates.UpdatedRows
		resp.UpdatedColumns = res.Updates.UpdatedColumns
		resp.UpdatedCells = res.Updates.UpdatedCells
	}
	return resp, nil
}

// UpdateRows overwrites a specific range in a spreadsheet with the provided values.
func (s *Service) UpdateRows(ctx context.Context, state, spreadsheetID, updateRange string, values [][]interface{}) (AppendRowsResponse, error) {
	if state == "" {
		return AppendRowsResponse{}, errors.New("state is required")
	}
	if spreadsheetID == "" {
		return AppendRowsResponse{}, errors.New("spreadsheetId is required")
	}
	if len(values) == 0 {
		return AppendRowsResponse{}, errors.New("values cannot be empty")
	}

	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		return AppendRowsResponse{}, errors.New("Google account is not connected for this state")
	}

	srv, err := newSheetsService(ctx, tok)
	if err != nil {
		return AppendRowsResponse{}, fmt.Errorf("init sheets client failed: %w", err)
	}

	resolvedRange := resolveRange(ctx, srv, spreadsheetID, updateRange)
	vr := &sheets.ValueRange{
		Values: values,
	}
	res, err := srv.Spreadsheets.Values.Update(spreadsheetID, resolvedRange, vr).
		ValueInputOption("USER_ENTERED").
		Context(ctx).
		Do()
	if err != nil {
		return AppendRowsResponse{}, fmt.Errorf("update rows failed: %w", err)
	}

	return AppendRowsResponse{
		SpreadsheetID:  spreadsheetID,
		UpdatedRange:   res.UpdatedRange,
		UpdatedRows:    res.UpdatedRows,
		UpdatedColumns: res.UpdatedColumns,
		UpdatedCells:   res.UpdatedCells,
	}, nil
}

// Column header indices mapping
type colIndices struct {
	stt      int
	refID    int
	date     int
	time     int
	card     int
	merchant int
	category int
	txType   int
	amount   int
	status   int
}

func defaultColIndices() colIndices {
	return colIndices{
		stt:      0,
		refID:    1,
		date:     2,
		time:     3,
		card:     4,
		merchant: 5,
		category: 6,
		txType:   -1,
		amount:   7,
		status:   8,
	}
}

func normalizeHeader(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	// Remove accents for resilient matching
	replacer := strings.NewReplacer(
		"á", "a", "à", "a", "ả", "a", "ã", "a", "ạ", "a",
		"ă", "a", "ắ", "a", "ằ", "a", "ẳ", "a", "ẵ", "a", "ặ", "a",
		"â", "a", "ấ", "a", "ầ", "a", "ẩ", "a", "ẫ", "a", "ậ", "a",
		"đ", "d",
		"é", "e", "è", "e", "ẻ", "e", "ẽ", "e", "ẹ", "e",
		"ê", "e", "ế", "e", "ề", "e", "ể", "e", "ễ", "e", "ệ", "e",
		"í", "i", "ì", "i", "ỉ", "i", "ĩ", "i", "ị", "i",
		"ó", "o", "ò", "o", "ỏ", "o", "õ", "o", "ọ", "o",
		"ô", "o", "ố", "o", "ồ", "o", "ổ", "o", "ỗ", "o", "ộ", "o",
		"ơ", "o", "ớ", "o", "ờ", "o", "ở", "o", "ỡ", "o", "ợ", "o",
		"ú", "u", "ù", "u", "ủ", "u", "ũ", "u", "ụ", "u",
		"ư", "u", "ứ", "u", "ừ", "u", "ử", "u", "ữ", "u", "ự", "u",
		"ý", "y", "ỳ", "y", "ỷ", "y", "ỹ", "y", "ỵ", "y",
	)
	return replacer.Replace(s)
}

func detectHeaderRow(rows [][]interface{}) (int, colIndices) {
	for idx, row := range rows {
		if idx > 15 {
			break
		}
		cols := colIndices{
			stt: -1, refID: -1, date: -1, time: -1, card: -1,
			merchant: -1, category: -1, txType: -1, amount: -1, status: -1,
		}
		matches := 0

		for colIdx, cell := range row {
			str := normalizeHeader(fmt.Sprintf("%v", cell))
			if str == "" {
				continue
			}
			// Skip metadata / summary cells
			if strings.HasPrefix(str, "chu the") || strings.HasPrefix(str, "the ap dung") ||
				strings.HasPrefix(str, "ngay xuat") || strings.HasPrefix(str, "cardflow") ||
				strings.HasPrefix(str, "tong chi") || strings.HasPrefix(str, "tong thu") ||
				strings.HasPrefix(str, "bien dong") {
				continue
			}

			switch {
			case str == "stt" || str == "no" || str == "#":
				cols.stt = colIdx
				matches++
			case strings.Contains(str, "ma gd") || strings.Contains(str, "ma giao dich") ||
				strings.Contains(str, "reference") || strings.Contains(str, "ref id") ||
				strings.Contains(str, "txn") || str == "id":
				cols.refID = colIdx
				matches++
			case strings.Contains(str, "ngay") || strings.Contains(str, "date"):
				cols.date = colIdx
				matches++
			case strings.Contains(str, "gio") || strings.Contains(str, "time"):
				cols.time = colIdx
				matches++
			case (strings.Contains(str, "the") && !strings.Contains(str, "chu the")) ||
				strings.Contains(str, "card") || strings.Contains(str, "last4"):
				cols.card = colIdx
				matches++
			case strings.Contains(str, "merchant") || strings.Contains(str, "don vi") ||
				strings.Contains(str, "cua hang") || strings.Contains(str, "noi dung") ||
				strings.Contains(str, "chap nhan"):
				cols.merchant = colIdx
				matches++
			case strings.Contains(str, "danh muc") || strings.Contains(str, "category"):
				cols.category = colIdx
				matches++
			case str == "loai" || strings.Contains(str, "type"):
				cols.txType = colIdx
			case strings.Contains(str, "so tien") || strings.Contains(str, "amount") || strings.Contains(str, "tien"):
				cols.amount = colIdx
				matches++
			case strings.Contains(str, "trang thai") || strings.Contains(str, "status"):
				cols.status = colIdx
				matches++
			}
		}

		// A valid transaction header row MUST have an amount column and at least 2 other transaction columns
		if cols.amount != -1 && matches >= 3 {
			return idx, cols
		}
	}

	return -1, defaultColIndices()
}

func getCellString(row []interface{}, idx int) string {
	if idx < 0 || idx >= len(row) || row[idx] == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprintf("%v", row[idx]))
}

// cleanAndParseAmount converts currency text to float64.
// For Cardflow: expenses are negative, income is positive.
func cleanAndParseAmount(raw string, typeHint string) (float64, string, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return 0, "expense", errors.New("số tiền trống")
	}

	isNegative := false
	if strings.HasPrefix(s, "-") || (strings.HasPrefix(s, "(") && strings.HasSuffix(s, ")")) {
		isNegative = true
	}
	typeHintLower := strings.ToLower(typeHint)
	if strings.Contains(typeHintLower, "chi") || strings.Contains(typeHintLower, "expense") {
		isNegative = true
	} else if strings.Contains(typeHintLower, "thu") || strings.Contains(typeHintLower, "hoan") || strings.Contains(typeHintLower, "income") {
		isNegative = false
	}

	// Remove common currency symbols and labels
	s = strings.ReplaceAll(s, "₫", "")
	s = strings.ReplaceAll(s, "VND", "")
	s = strings.ReplaceAll(s, "vnd", "")
	s = strings.ReplaceAll(s, "$", "")
	s = strings.ReplaceAll(s, "(", "")
	s = strings.ReplaceAll(s, ")", "")
	s = strings.ReplaceAll(s, "+", "")
	s = strings.ReplaceAll(s, "-", "")
	s = strings.TrimSpace(s)

	// Clean dots and commas
	cleanNumber := strings.Builder{}
	for _, r := range s {
		if unicode.IsDigit(r) {
			cleanNumber.WriteRune(r)
		}
	}

	numStr := cleanNumber.String()
	if numStr == "" {
		return 0, "expense", errors.New("không thể chuyển đổi số tiền")
	}

	val, err := strconv.ParseFloat(numStr, 64)
	if err != nil {
		return 0, "expense", err
	}

	var txType string
	if isNegative {
		val = -math.Abs(val)
		txType = "expense"
	} else {
		val = math.Abs(val)
		txType = "income"
	}

	return val, txType, nil
}

func cleanCardLast4(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "8842"
	}
	// Extract 4 digits if present
	digits := ""
	for _, r := range raw {
		if unicode.IsDigit(r) {
			digits += string(r)
		}
	}
	if len(digits) >= 4 {
		return digits[len(digits)-4:]
	}
	if len(digits) > 0 {
		return digits
	}
	return "8842"
}

func mapCategory(label string) (code, cleanLabel string) {
	norm := normalizeHeader(label)
	switch {
	case strings.Contains(norm, "am thuc") || strings.Contains(norm, "an uong") || strings.Contains(norm, "dining") || strings.Contains(norm, "cafe") || strings.Contains(norm, "ca phe"):
		return "dining", "Ẩm thực & Cafe"
	case strings.Contains(norm, "mua sam") || strings.Contains(norm, "shopping"):
		return "shopping", "Mua sắm"
	case strings.Contains(norm, "di chuyen") || strings.Contains(norm, "transport") || strings.Contains(norm, "xang") || strings.Contains(norm, "taxi"):
		return "transport", "Di chuyển"
	case strings.Contains(norm, "cong nghe") || strings.Contains(norm, "tech") || strings.Contains(norm, "dien thoai"):
		return "tech", "Công nghệ"
	case strings.Contains(norm, "luong") || strings.Contains(norm, "salary") || strings.Contains(norm, "thu nhap"):
		return "salary", "Lương & Thu nhập"
	case strings.Contains(norm, "hoan") || strings.Contains(norm, "refund"):
		return "refund", "Hoàn tiền"
	case strings.Contains(norm, "nha") || strings.Contains(norm, "housing") || strings.Contains(norm, "thue"):
		return "housing", "Nhà ở & Tiện ích"
	case strings.Contains(norm, "dau tu") || strings.Contains(norm, "investment") || strings.Contains(norm, "tiet kiem"):
		return "investment", "Đầu tư & Tiết kiệm"
	case strings.Contains(norm, "giao duc") || strings.Contains(norm, "education") || strings.Contains(norm, "khoa hoc"):
		return "education", "Giáo dục"
	default:
		if label == "" {
			return "other", "Khác"
		}
		return "other", strings.TrimSpace(label)
	}
}

// ImportSheet reads a Google Sheet or CSV file from Drive, detects the header structure, parses each transaction row, and returns a verified preview response.
func (s *Service) ImportSheet(ctx context.Context, req ImportSheetRequest) (ImportSheetResponse, error) {
	if req.State == "" {
		return ImportSheetResponse{}, errors.New("state is required")
	}
	cleanSpreadsheetID := ExtractSpreadsheetID(req.SpreadsheetID)
	if cleanSpreadsheetID == "" {
		return ImportSheetResponse{}, errors.New("spreadsheetId is required")
	}

	tok, ok := s.repo.GetToken(ctx, req.State)
	if !ok || tok == nil {
		return ImportSheetResponse{}, errors.New("Google account is not connected for this state")
	}

	srv, err := newSheetsService(ctx, tok)
	if err != nil {
		return ImportSheetResponse{}, fmt.Errorf("init sheets client failed: %w", err)
	}

	var rows [][]interface{}
	title := "Google Sheet"

	// Attempt 1: Fetch via Google Sheets API
	sheetMeta, err := srv.Spreadsheets.Get(cleanSpreadsheetID).
		Fields("properties(title),sheets(properties(title))").
		Context(ctx).
		Do()
	if err == nil && sheetMeta != nil {
		if sheetMeta.Properties.Title != "" {
			title = sheetMeta.Properties.Title
		}
		resolvedRange := resolveRange(ctx, srv, cleanSpreadsheetID, req.Range)
		valResp, vErr := srv.Spreadsheets.Values.Get(cleanSpreadsheetID, resolvedRange).Context(ctx).Do()
		if vErr == nil && valResp != nil {
			rows = valResp.Values
		}
	} else {
		// Attempt 2: If Sheets API fails (e.g. file is CSV on Drive), try downloading via Drive API
		ds, dErr := drivefeat.NewDriveService(ctx, tok)
		if dErr == nil {
			dFile, fErr := ds.Files.Get(cleanSpreadsheetID).Fields("id,name,mimeType").Context(ctx).Do()
			if fErr == nil && dFile != nil {
				title = dFile.Name
				resp, dlErr := ds.Files.Get(cleanSpreadsheetID).Download()
				if dlErr == nil && resp != nil {
					defer resp.Body.Close()
					r := csv.NewReader(resp.Body)
					r.LazyQuotes = true
					r.FieldsPerRecord = -1
					records, readErr := r.ReadAll()
					if readErr == nil {
						for _, rec := range records {
							row := make([]interface{}, len(rec))
							for ci, val := range rec {
								row[ci] = val
							}
							rows = append(rows, row)
						}
					}
				}
			}
		}
		if len(rows) == 0 && err != nil {
			return ImportSheetResponse{}, fmt.Errorf("không thể đọc file từ Google: %w", err)
		}
	}

	parsedItems := make([]ParsedTransactionItem, 0)
	if len(rows) == 0 {
		return ImportSheetResponse{
			SpreadsheetID: cleanSpreadsheetID,
			Title:         title,
			TotalRows:     0,
			ValidCount:    0,
			ErrorCount:    0,
			Transactions:  parsedItems,
		}, nil
	}

	// 3. Find Header row and column map
	headerIdx, cols := detectHeaderRow(rows)
	startRow := 0
	if headerIdx >= 0 {
		startRow = headerIdx + 1
	}

	var totalExpense, totalIncome float64
	validCount := 0
	errorCount := 0

	for i := startRow; i < len(rows); i++ {
		row := rows[i]
		if len(row) == 0 {
			continue
		}

		refStr := getCellString(row, cols.refID)
		merchantStr := getCellString(row, cols.merchant)
		dateStr := getCellString(row, cols.date)
		timeStr := getCellString(row, cols.time)
		cardStr := getCellString(row, cols.card)
		categoryStr := getCellString(row, cols.category)
		typeHint := getCellString(row, cols.txType)
		amountStr := getCellString(row, cols.amount)
		statusStr := getCellString(row, cols.status)

		// Skip header repeats or report summary lines (e.g. "Tổng chi tiêu:", "Tổng thu:")
		firstCell := getCellString(row, 0)
		lowerFirst := strings.ToLower(firstCell)
		if strings.HasPrefix(lowerFirst, "tong ") || strings.HasPrefix(lowerFirst, "chu the:") || strings.HasPrefix(lowerFirst, "cardflow -") {
			continue
		}

		// If row has neither amount nor merchant, skip it
		if amountStr == "" && merchantStr == "" && refStr == "" {
			continue
		}

		amount, txType, pErr := cleanAndParseAmount(amountStr, typeHint)
		isValid := true
		errorMsg := ""

		if pErr != nil {
			isValid = false
			errorMsg = fmt.Sprintf("Lỗi số tiền '%s': %v", amountStr, pErr)
			errorCount++
		} else {
			validCount++
			if amount < 0 {
				totalExpense += math.Abs(amount)
			} else {
				totalIncome += amount
			}
		}

		if refStr == "" {
			refStr = fmt.Sprintf("IMP-%s-%04d", time.Now().Format("20060102"), i+1)
		}
		if dateStr == "" {
			dateStr = time.Now().Format("2006-01-02")
		}
		if timeStr == "" {
			timeStr = "12:00"
		}
		if statusStr == "" {
			statusStr = "Thành công"
		}
		if merchantStr == "" {
			merchantStr = "Giao dịch không tên"
		}

		catCode, catLabel := mapCategory(categoryStr)
		cardLast4 := cleanCardLast4(cardStr)

		item := ParsedTransactionItem{
			ID:            fmt.Sprintf("tx-imp-%d-%d", time.Now().UnixNano(), i),
			ReferenceID:   refStr,
			Date:          dateStr,
			Time:          timeStr,
			CardLast4:     cardLast4,
			Merchant:      merchantStr,
			Category:      catCode,
			CategoryLabel: catLabel,
			Amount:        amount,
			Type:          txType,
			Status:        statusStr,
			IsValid:       isValid,
			ErrorMessage:  errorMsg,
		}

		parsedItems = append(parsedItems, item)
	}

	netChange := totalIncome - totalExpense

	return ImportSheetResponse{
		SpreadsheetID: cleanSpreadsheetID,
		Title:         title,
		TotalRows:     len(parsedItems),
		ValidCount:    validCount,
		ErrorCount:    errorCount,
		TotalExpense:  totalExpense,
		TotalIncome:   totalIncome,
		NetChange:     netChange,
		Transactions:  parsedItems,
	}, nil
}
