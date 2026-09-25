package drive

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"google.golang.org/api/drive/v3"
	"golang.org/x/oauth2"
)

// Service owns Drive OAuth logic and file operations.
type Service struct {
	repo Repository
}

// NewService creates a Drive service using a repository-backed token store.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// CardFlowFolderName is the standard folder name in Google Drive for all cardflow sheets and files.
const CardFlowFolderName = "CardFlow"

// EnsureFolder checks if a folder with the given name exists in Drive (non-trashed);
// if not found, it creates the folder. Returns the folder ID.
func EnsureFolder(ctx context.Context, ds *drive.Service, folderName string) (string, error) {
	if folderName == "" {
		folderName = CardFlowFolderName
	}
	escapedName := strings.ReplaceAll(folderName, "'", "\\'")
	query := fmt.Sprintf("name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false", escapedName)

	list, err := ds.Files.List().
		Q(query).
		Fields("files(id, name)").
		PageSize(1).
		Context(ctx).
		Do()
	if err != nil {
		return "", fmt.Errorf("search folder '%s' failed: %w", folderName, err)
	}
	if len(list.Files) > 0 {
		return list.Files[0].Id, nil
	}

	folder := &drive.File{
		Name:     folderName,
		MimeType: "application/vnd.google-apps.folder",
	}
	created, err := ds.Files.Create(folder).Fields("id, name").Context(ctx).Do()
	if err != nil {
		return "", fmt.Errorf("create folder '%s' failed: %w", folderName, err)
	}
	return created.Id, nil
}

// FindExcelAndSheetFiles queries all Google Sheets and Excel/CSV files in the given folder.
func FindExcelAndSheetFiles(ctx context.Context, ds *drive.Service, folderID string) ([]DriveFile, error) {
	if folderID == "" {
		return nil, fmt.Errorf("folderID is required")
	}

	query := fmt.Sprintf("'%s' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'application/vnd.ms-excel' or name contains '.xlsx' or name contains '.xls' or name contains '.csv')", folderID)

	files, err := ds.Files.List().
		Q(query).
		Fields("files(id,name,mimeType,webViewLink,size,modifiedTime)").
		PageSize(100).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("find excel and sheet files failed: %w", err)
	}

	result := make([]DriveFile, 0, len(files.Files))
	for _, f := range files.Files {
		result = append(result, DriveFile{
			ID:         f.Id,
			Name:       f.Name,
			MimeType:   f.MimeType,
			WebViewURL: f.WebViewLink,
			Size:       strconv.FormatInt(f.Size, 10),
		})
	}
	return result, nil
}

func detectMimeType(fileName, provided string) string {
	if provided != "" {
		return provided
	}
	lower := strings.ToLower(fileName)
	switch {
	case strings.HasSuffix(lower, ".xlsx"):
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case strings.HasSuffix(lower, ".xls"):
		return "application/vnd.ms-excel"
	case strings.HasSuffix(lower, ".csv"):
		return "text/csv"
	default:
		return "text/plain"
	}
}

// Connect starts a Google OAuth flow and returns an auth URL plus generated state.
func (s *Service) Connect(ctx context.Context) (ConnectResponse, error) {
	cfg := newOAuthConfig()
	if cfg.ClientID == "" || cfg.ClientSecret == "" {
		return ConnectResponse{}, fmt.Errorf("GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET must be configured")
	}

	state := randomState()
	if err := s.repo.SaveState(ctx, state); err != nil {
		return ConnectResponse{}, err
	}

	return ConnectResponse{
		State:   state,
		AuthURL: cfg.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce),
	}, nil
}

// Callback exchanges the Google code and persists the resulting OAuth token.
// When logging in, it automatically ensures the "CardFlow" folder exists on Google Drive,
// scans for any existing Excel/Sheet files inside it, and loads them into the system.
func (s *Service) Callback(ctx context.Context, code, state string) (CallbackResponse, error) {
	if code == "" || state == "" {
		return CallbackResponse{}, fmt.Errorf("code and state are required")
	}
	if !s.repo.ValidateState(ctx, state) {
		return CallbackResponse{}, fmt.Errorf("state is invalid or expired")
	}

	cfg := newOAuthConfig()
	tok, err := cfg.Exchange(ctx, code)
	if err != nil {
		return CallbackResponse{}, fmt.Errorf("exchange code failed: %w", err)
	}
	if err := s.repo.SaveToken(ctx, state, tok); err != nil {
		return CallbackResponse{}, err
	}

	scope := ""
	if v, ok := tok.Extra("scope").(string); ok {
		scope = v
	}

	// Auto check/create "CardFlow" folder and import existing Excel/Sheet files
	var folderID string
	var importedFiles []DriveFile
	ds, err := NewDriveService(ctx, tok)
	if err == nil {
		fID, fErr := EnsureFolder(ctx, ds, CardFlowFolderName)
		if fErr == nil {
			folderID = fID
			_ = s.repo.SaveFolderID(ctx, state, folderID)
			files, sErr := FindExcelAndSheetFiles(ctx, ds, folderID)
			if sErr == nil {
				importedFiles = files
				_ = s.repo.SaveImportedFiles(ctx, state, importedFiles)
			}
		}
	}

	message := fmt.Sprintf("Google Drive connected successfully. Folder '%s' ready", CardFlowFolderName)
	if len(importedFiles) > 0 {
		message = fmt.Sprintf("Google Drive connected successfully. Loaded %d existing Excel/Sheet file(s) from '%s' folder", len(importedFiles), CardFlowFolderName)
	}

	return CallbackResponse{
		State:         state,
		TokenType:     tok.TokenType,
		Expiry:        tok.Expiry,
		Scope:         scope,
		Message:       message,
		Connected:     true,
		FolderID:      folderID,
		FolderName:    CardFlowFolderName,
		ImportedFiles: importedFiles,
	}, nil
}

// ListFiles lists up to 20 non-deleted files in the connected Drive account.
func (s *Service) ListFiles(ctx context.Context, state string) ([]DriveFile, error) {
	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		return nil, fmt.Errorf("Drive is not connected for this state")
	}

	ds, err := NewDriveService(ctx, tok)
	if err != nil {
		return nil, fmt.Errorf("create Drive client failed: %w", err)
	}

	files, err := ds.Files.List().
		Q("trashed = false").
		Fields("files(id,name,mimeType,webViewLink,size,modifiedTime)").
		PageSize(20).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("list files failed: %w", err)
	}

	result := make([]DriveFile, 0, len(files.Files))
	for _, f := range files.Files {
		result = append(result, DriveFile{
			ID:         f.Id,
			Name:       f.Name,
			MimeType:   f.MimeType,
			WebViewURL: f.WebViewLink,
			Size:       strconv.FormatInt(f.Size, 10),
		})
	}
	return result, nil
}

// UploadTextFile uploads a text file directly into the "CardFlow" folder.
func (s *Service) UploadTextFile(ctx context.Context, state, fileName, content string) (DriveFile, error) {
	return s.UploadFile(ctx, UploadRequest{
		State:    state,
		FileName: fileName,
		Content:  content,
		MimeType: "text/plain",
	})
}

// UploadFile uploads any file directly into the "CardFlow" folder on the connected Drive.
func (s *Service) UploadFile(ctx context.Context, req UploadRequest) (DriveFile, error) {
	if req.FileName == "" {
		return DriveFile{}, fmt.Errorf("fileName is required")
	}
	if req.Content == "" {
		return DriveFile{}, fmt.Errorf("content is required")
	}

	tok, ok := s.repo.GetToken(ctx, req.State)
	if !ok || tok == nil {
		return DriveFile{}, fmt.Errorf("Drive is not connected for this state")
	}

	ds, err := NewDriveService(ctx, tok)
	if err != nil {
		return DriveFile{}, fmt.Errorf("create Drive client failed: %w", err)
	}

	folderID, err := EnsureFolder(ctx, ds, CardFlowFolderName)
	if err != nil {
		return DriveFile{}, fmt.Errorf("ensure '%s' folder failed: %w", CardFlowFolderName, err)
	}
	_ = s.repo.SaveFolderID(ctx, req.State, folderID)

	mimeType := detectMimeType(req.FileName, req.MimeType)
	file := &drive.File{
		Name:     req.FileName,
		MimeType: mimeType,
		Parents:  []string{folderID},
	}
	created, err := ds.Files.Create(file).Media(strings.NewReader(req.Content)).Context(ctx).Do()
	if err != nil {
		return DriveFile{}, fmt.Errorf("upload file failed: %w", err)
	}

	df := DriveFile{
		ID:         created.Id,
		Name:       created.Name,
		MimeType:   created.MimeType,
		WebViewURL: created.WebViewLink,
		Size:       strconv.FormatInt(created.Size, 10),
	}

	// If uploaded file is Excel/Sheet/CSV, track in imported files
	if strings.Contains(mimeType, "spreadsheet") || strings.Contains(mimeType, "excel") || strings.HasSuffix(strings.ToLower(req.FileName), ".xlsx") || strings.HasSuffix(strings.ToLower(req.FileName), ".xls") || strings.HasSuffix(strings.ToLower(req.FileName), ".csv") {
		if existing, ok := s.repo.GetImportedFiles(ctx, req.State); ok {
			_ = s.repo.SaveImportedFiles(ctx, req.State, append(existing, df))
		} else {
			_ = s.repo.SaveImportedFiles(ctx, req.State, []DriveFile{df})
		}
	}

	return df, nil
}

// SyncCardFlowFiles inspects the "CardFlow" folder and refreshes the stored Excel and Sheet files.
func (s *Service) SyncCardFlowFiles(ctx context.Context, state string) (SyncFilesResponse, error) {
	if state == "" {
		return SyncFilesResponse{}, fmt.Errorf("state is required")
	}
	tok, ok := s.repo.GetToken(ctx, state)
	if !ok || tok == nil {
		return SyncFilesResponse{}, fmt.Errorf("Drive is not connected for this state")
	}

	ds, err := NewDriveService(ctx, tok)
	if err != nil {
		return SyncFilesResponse{}, fmt.Errorf("create Drive client failed: %w", err)
	}

	folderID, err := EnsureFolder(ctx, ds, CardFlowFolderName)
	if err != nil {
		return SyncFilesResponse{}, fmt.Errorf("ensure '%s' folder failed: %w", CardFlowFolderName, err)
	}
	_ = s.repo.SaveFolderID(ctx, state, folderID)

	files, err := FindExcelAndSheetFiles(ctx, ds, folderID)
	if err != nil {
		return SyncFilesResponse{}, fmt.Errorf("sync files failed: %w", err)
	}
	_ = s.repo.SaveImportedFiles(ctx, state, files)

	return SyncFilesResponse{
		FolderID:   folderID,
		FolderName: CardFlowFolderName,
		Files:      files,
		Total:      len(files),
	}, nil
}

// GetImportedFiles returns currently imported Excel/Sheet files for the given state.
func (s *Service) GetImportedFiles(ctx context.Context, state string) ([]DriveFile, error) {
	if state == "" {
		return nil, fmt.Errorf("state is required")
	}
	files, ok := s.repo.GetImportedFiles(ctx, state)
	if !ok {
		resp, err := s.SyncCardFlowFiles(ctx, state)
		if err != nil {
			return []DriveFile{}, nil
		}
		return resp.Files, nil
	}
	return files, nil
}

