package drive

import (
	"context"
	"testing"
	"time"

	"golang.org/x/oauth2"
)

func TestStore_StateAndToken(t *testing.T) {
	ctx := context.Background()
	s := NewStore()

	// State
	state := "test-state-123"
	if s.ValidateState(ctx, state) {
		t.Fatalf("expected state to not exist yet")
	}

	if err := s.SaveState(ctx, state); err != nil {
		t.Fatalf("unexpected error saving state: %v", err)
	}

	if !s.ValidateState(ctx, state) {
		t.Fatalf("expected state to be valid")
	}

	if err := s.SaveState(ctx, ""); err == nil {
		t.Fatalf("expected error saving empty state")
	}

	// Token
	tok := &oauth2.Token{
		AccessToken: "sample-token",
		Expiry:      time.Now().Add(1 * time.Hour),
	}

	if _, ok := s.GetToken(ctx, state); ok {
		t.Fatalf("expected token not found before saving")
	}

	if err := s.SaveToken(ctx, state, tok); err != nil {
		t.Fatalf("unexpected error saving token: %v", err)
	}

	gotTok, ok := s.GetToken(ctx, state)
	if !ok || gotTok.AccessToken != tok.AccessToken {
		t.Fatalf("expected token to match, got %v", gotTok)
	}

	if err := s.SaveToken(ctx, "", tok); err == nil {
		t.Fatalf("expected error saving token with empty state")
	}

	if err := s.SaveToken(ctx, state, nil); err == nil {
		t.Fatalf("expected error saving nil token")
	}
}

func TestStore_FolderID(t *testing.T) {
	ctx := context.Background()
	s := NewStore()
	state := "state-abc"

	if _, ok := s.GetFolderID(ctx, state); ok {
		t.Fatalf("expected no folderID before save")
	}

	folderID := "folder-12345"
	if err := s.SaveFolderID(ctx, state, folderID); err != nil {
		t.Fatalf("unexpected error saving folderID: %v", err)
	}

	gotID, ok := s.GetFolderID(ctx, state)
	if !ok || gotID != folderID {
		t.Fatalf("expected folderID %s, got %s", folderID, gotID)
	}

	if err := s.SaveFolderID(ctx, "", folderID); err == nil {
		t.Fatalf("expected error with empty state")
	}
}

func TestStore_ImportedFiles(t *testing.T) {
	ctx := context.Background()
	s := NewStore()
	state := "state-xyz"

	if _, ok := s.GetImportedFiles(ctx, state); ok {
		t.Fatalf("expected no imported files initially")
	}

	files := []DriveFile{
		{ID: "f1", Name: "report.xlsx", MimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
		{ID: "f2", Name: "data.csv", MimeType: "text/csv"},
	}

	if err := s.SaveImportedFiles(ctx, state, files); err != nil {
		t.Fatalf("unexpected error saving imported files: %v", err)
	}

	gotFiles, ok := s.GetImportedFiles(ctx, state)
	if !ok || len(gotFiles) != len(files) {
		t.Fatalf("expected %d files, got %v", len(files), gotFiles)
	}

	if gotFiles[0].Name != "report.xlsx" || gotFiles[1].Name != "data.csv" {
		t.Fatalf("unexpected file content: %v", gotFiles)
	}

	if err := s.SaveImportedFiles(ctx, "", files); err == nil {
		t.Fatalf("expected error with empty state")
	}
}
