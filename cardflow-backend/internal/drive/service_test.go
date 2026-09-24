package drive

import (
	"context"
	"os"
	"strings"
	"testing"

	"golang.org/x/oauth2"
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

	// Invalid / disconnected state should fail clearly instead of returning empty list.
	_, err = svc.GetImportedFiles(ctx, "missing-state")
	if err == nil {
		t.Fatalf("expected error for disconnected state")
	}

	state := "state-test-files"
	files := []DriveFile{
		{ID: "f10", Name: "inventory.xlsx"},
	}
	_ = store.SaveToken(ctx, state, &oauth2.Token{AccessToken: "token-for-files"})
	_ = store.SaveImportedFiles(ctx, state, files)

	got, err := svc.GetImportedFiles(ctx, state)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || got[0].Name != "inventory.xlsx" {
		t.Fatalf("unexpected files returned: %v", got)
	}
}

func TestService_Connect_LoadsConfigFromProjectEnv(t *testing.T) {
	ctx := context.Background()
	store := NewStore()
	svc := NewService(store)

	prevClientID, hadClientID := os.LookupEnv("GOOGLE_DRIVE_CLIENT_ID")
	prevClientSecret, hadClientSecret := os.LookupEnv("GOOGLE_DRIVE_CLIENT_SECRET")
	if err := os.Unsetenv("GOOGLE_DRIVE_CLIENT_ID"); err != nil {
		t.Fatalf("unset GOOGLE_DRIVE_CLIENT_ID: %v", err)
	}
	if err := os.Unsetenv("GOOGLE_DRIVE_CLIENT_SECRET"); err != nil {
		t.Fatalf("unset GOOGLE_DRIVE_CLIENT_SECRET: %v", err)
	}
	defer func() {
		if hadClientID {
			_ = os.Setenv("GOOGLE_DRIVE_CLIENT_ID", prevClientID)
		} else {
			_ = os.Unsetenv("GOOGLE_DRIVE_CLIENT_ID")
		}
		if hadClientSecret {
			_ = os.Setenv("GOOGLE_DRIVE_CLIENT_SECRET", prevClientSecret)
		} else {
			_ = os.Unsetenv("GOOGLE_DRIVE_CLIENT_SECRET")
		}
	}()

	res, err := svc.Connect(ctx)
	if err != nil {
		t.Fatalf("expected Connect to load project env config, got error: %v", err)
	}
	if res.State == "" || res.AuthURL == "" {
		t.Fatal("expected valid auth URL and state")
	}
	if !strings.Contains(res.AuthURL, "client_id=") {
		t.Fatalf("expected auth URL to include client_id, got %q", res.AuthURL)
	}
}
