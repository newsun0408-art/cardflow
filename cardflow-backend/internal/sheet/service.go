package sheet

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	drivefeat "github.com/bangdinh/cardflow-backend/internal/drive"
	"google.golang.org/api/drive/v3"
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

	ds, err := drivefeat.NewDriveService(ctx, tok)
	if err != nil {
		return SpreadsheetResponse{}, fmt.Errorf("init drive client failed: %w", err)
	}

	folderID, err := drivefeat.EnsureFolder(ctx, ds, drivefeat.CardFlowFolderName)
	if err != nil {
		return SpreadsheetResponse{}, fmt.Errorf("ensure folder failed: %w", err)
	}
	_ = s.repo.SaveFolderID(ctx, state, folderID)

	var spreadsheetID, spreadsheetURL string
	// Try creating directly in the folder using Drive API (avoids 403 on root)
	driveFileMeta := &drive.File{
		Name:     title,
		MimeType: "application/vnd.google-apps.spreadsheet",
		Parents:  []string{folderID},
	}
	createdFile, dErr := ds.Files.Create(driveFileMeta).Fields("id, name, webViewLink").Context(ctx).Do()
	if dErr == nil && createdFile != nil && createdFile.Id != "" {
		spreadsheetID = createdFile.Id
		spreadsheetURL = createdFile.WebViewLink
	} else {
		// Fallback to Sheets API create
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
		res, cErr := srv.Spreadsheets.Create(ss).Context(ctx).Do()
		if cErr != nil {
			return SpreadsheetResponse{}, fmt.Errorf("create spreadsheet failed: %w", cErr)
		}
		spreadsheetID = res.SpreadsheetId
		spreadsheetURL = res.SpreadsheetUrl
		_, _ = ds.Files.Update(spreadsheetID, nil).AddParents(folderID).RemoveParents("root").Context(ctx).Do()
	}

	newFile := drivefeat.DriveFile{
		ID:         spreadsheetID,
		Name:       title,
		MimeType:   "application/vnd.google-apps.spreadsheet",
		WebViewURL: spreadsheetURL,
	}
	if existing, ok := s.repo.GetImportedFiles(ctx, state); ok {
		_ = s.repo.SaveImportedFiles(ctx, state, append(existing, newFile))
	} else {
		_ = s.repo.SaveImportedFiles(ctx, state, []drivefeat.DriveFile{newFile})
	}

	return SpreadsheetResponse{
		SpreadsheetID:  spreadsheetID,
		Title:          title,
		SpreadsheetURL: spreadsheetURL,
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

// SaveCards creates or updates a Google Sheet in the "CardFlow" folder with the given cards data.
func (s *Service) SaveCards(ctx context.Context, state string, cards []CardItemDTO) (SaveCardsResponse, error) {
	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		var activeState string
		tok, activeState, ok = s.repo.GetLatestToken(ctx)
		if ok && activeState != "" {
			state = activeState
		}
	}
	if !ok || tok == nil {
		return SaveCardsResponse{}, errors.New("Google Drive & Sheets chưa được kết nối. Vui lòng kết nối Google trước.")
	}

	srv, err := newSheetsService(ctx, tok)
	if err != nil {
		return SaveCardsResponse{}, fmt.Errorf("khởi tạo Google Sheets client thất bại: %w", err)
	}

	ds, err := drivefeat.NewDriveService(ctx, tok)
	if err != nil {
		return SaveCardsResponse{}, fmt.Errorf("khởi tạo Google Drive client thất bại: %w", err)
	}

	folderID, err := drivefeat.EnsureFolder(ctx, ds, drivefeat.CardFlowFolderName)
	if err != nil {
		return SaveCardsResponse{}, fmt.Errorf("chuẩn bị thư mục Google Drive '%s' thất bại: %w", drivefeat.CardFlowFolderName, err)
	}
	_ = s.repo.SaveFolderID(ctx, state, folderID)

	sheetTitle := "CardFlow - Danh Sách Thẻ Cá Nhân"
	var spreadsheetID, spreadsheetURL string

	// Check if the spreadsheet already exists in folder
	q := fmt.Sprintf("name = '%s' and mimeType = 'application/vnd.google-apps.spreadsheet' and '%s' in parents and trashed = false", sheetTitle, folderID)
	list, lErr := ds.Files.List().Q(q).Fields("files(id, name, webViewLink)").PageSize(1).Context(ctx).Do()
	if lErr == nil && len(list.Files) > 0 {
		spreadsheetID = list.Files[0].Id
		spreadsheetURL = list.Files[0].WebViewLink
	} else {
		// Create new spreadsheet directly inside CardFlow folder using Drive API (avoids 403 on root)
		driveFileMeta := &drive.File{
			Name:     sheetTitle,
			MimeType: "application/vnd.google-apps.spreadsheet",
			Parents:  []string{folderID},
		}
		createdFile, dErr := ds.Files.Create(driveFileMeta).Fields("id, name, webViewLink").Context(ctx).Do()
		if dErr == nil && createdFile != nil && createdFile.Id != "" {
			spreadsheetID = createdFile.Id
			spreadsheetURL = createdFile.WebViewLink
		} else {
			// Fallback to Sheets API create
			ss := &sheets.Spreadsheet{
				Properties: &sheets.SpreadsheetProperties{
					Title: sheetTitle,
				},
				Sheets: []*sheets.Sheet{
					{
						Properties: &sheets.SheetProperties{
							Title: "Danh Sách Thẻ",
						},
					},
				},
			}
			created, cErr := srv.Spreadsheets.Create(ss).Context(ctx).Do()
			if cErr != nil {
				return SaveCardsResponse{}, fmt.Errorf("tạo Google Sheet thất bại: %w (drive fallback: %v)", cErr, dErr)
			}
			spreadsheetID = created.SpreadsheetId
			spreadsheetURL = created.SpreadsheetUrl

			// Move into CardFlow folder
			_, _ = ds.Files.Update(spreadsheetID, nil).
				AddParents(folderID).
				RemoveParents("root").
				Context(ctx).
				Do()
		}
	}

	// Prepare data rows
	headers := []interface{}{
		"STT",
		"Tên Gợi Nhớ",
		"Tên Chủ Thẻ",
		"Số Thẻ (PAN)",
		"Loại Thẻ",
		"Mạng Thanh Toán",
		"Ngân Hàng",
		"Hạn Dùng / Ngày Phát Hành",
		"Số Dư (VND)",
		"Hạn Mức Ngày (VND)",
		"Trạng Thái",
		"Mã Thẻ (ID)",
		"Thời Gian Cập Nhật",
	}

	nowStr := time.Now().Format("02/01/2006 15:04:05")
	var rows [][]interface{}
	rows = append(rows, headers)

	for i, c := range cards {
		stt := i + 1
		category := "Thẻ Quốc Tế"
		if strings.EqualFold(c.CardCategory, "domestic") || strings.Contains(strings.ToUpper(c.CardType), "NAPAS") || strings.Contains(strings.ToUpper(c.CardNetwork), "NAPAS") {
			category = "Thẻ Nội Địa (Napas ATM)"
		}
		network := c.CardNetwork
		if network == "" {
			network = c.CardType
		}
		status := c.Status
		if status == "" {
			status = "Hoạt động"
		}
		holder := strings.ToUpper(strings.TrimSpace(c.HolderName))
		expOrIssue := c.ExpiryOrIssueDate
		if expOrIssue == "" {
			expOrIssue = "N/A"
		}

		balanceStr := fmt.Sprintf("%d", c.Balance)
		limitStr := fmt.Sprintf("%d", c.DailyLimit)

		rows = append(rows, []interface{}{
			stt,
			c.Nickname,
			holder,
			c.CardNumber,
			category,
			network,
			c.BankName,
			expOrIssue,
			balanceStr,
			limitStr,
			status,
			c.ID,
			nowStr,
		})
	}

	// Clear older rows to prevent overlap
	_, _ = srv.Spreadsheets.Values.Clear(spreadsheetID, "A1:Z500", &sheets.ClearValuesRequest{}).Context(ctx).Do()

	resolvedRange := resolveRange(ctx, srv, spreadsheetID, "A1")
	vr := &sheets.ValueRange{
		Values: rows,
	}
	_, err = srv.Spreadsheets.Values.Update(spreadsheetID, resolvedRange, vr).
		ValueInputOption("USER_ENTERED").
		Context(ctx).
		Do()
	if err != nil {
		return SaveCardsResponse{}, fmt.Errorf("ghi dữ liệu vào Google Sheet thất bại: %w", err)
	}

	// Save to imported files list
	newFile := drivefeat.DriveFile{
		ID:         spreadsheetID,
		Name:       sheetTitle,
		MimeType:   "application/vnd.google-apps.spreadsheet",
		WebViewURL: spreadsheetURL,
	}
	if existing, ok := s.repo.GetImportedFiles(ctx, state); ok {
		found := false
		for i, ef := range existing {
			if ef.ID == spreadsheetID {
				existing[i] = newFile
				found = true
				break
			}
		}
		if !found {
			existing = append(existing, newFile)
		}
		_ = s.repo.SaveImportedFiles(ctx, state, existing)
	} else {
		_ = s.repo.SaveImportedFiles(ctx, state, []drivefeat.DriveFile{newFile})
	}

	return SaveCardsResponse{
		SpreadsheetID:  spreadsheetID,
		SpreadsheetURL: spreadsheetURL,
		FolderID:       folderID,
		FolderName:     drivefeat.CardFlowFolderName,
		SavedCards:     len(cards),
		Message:        fmt.Sprintf("Đã lưu thành công %d thẻ vào Google Sheet trong thư mục '%s'", len(cards), drivefeat.CardFlowFolderName),
	}, nil
}

