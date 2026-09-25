package drive

import (
	"context"
	"testing"
)

func TestDetectMimeType(t *testing.T) {
	tests := []struct {
		fileName string
		provided string
		expected string
	}{
		{
			fileName: "sheet.xlsx",
			provided: "",
			expected: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		},
		{
			fileName: "old_sheet.xls",
			provided: "",
			expected: "application/vnd.ms-excel",
		},
		{
			fileName: "cards.csv",
			provided: "",
			expected: "text/csv",
		},
		{
			fileName: "note.txt",
			provided: "",
			expected: "text/plain",
		},
		{
			fileName: "custom.bin",
			provided: "application/octet-stream",
			expected: "application/octet-stream",
		},
	}

	for _, tt := range tests {
		got := detectMimeType(tt.fileName, tt.provided)
		if got != tt.expected {
			t.Errorf("detectMimeType(%q, %q) = %q; want %q", tt.fileName, tt.provided, got, tt.expected)
		}
	}
}

func TestService_GetImportedFiles(t *testing.T) {
	ctx := context.Background()
	store := NewStore()
	svc := NewService(store)

	// State empty
	_, err := svc.GetImportedFiles(ctx, "")
	if err == nil {
		t.Fatalf("expected error for empty state")
	}

	state := "state-test-files"
	files := []DriveFile{
		{ID: "f10", Name: "inventory.xlsx"},
	}
	_ = store.SaveImportedFiles(ctx, state, files)

	got, err := svc.GetImportedFiles(ctx, state)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || got[0].Name != "inventory.xlsx" {
		t.Fatalf("unexpected files returned: %v", got)
	}
}

func TestService_Connect_EmptyConfig(t *testing.T) {
	ctx := context.Background()
	store := NewStore()
	svc := NewService(store)

	// In test environment without GOOGLE_DRIVE_CLIENT_ID set, Connect returns error
	_, err := svc.Connect(ctx)
	if err == nil {
		t.Fatalf("expected error when credentials are not configured")
	}
}
