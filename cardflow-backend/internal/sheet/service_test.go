package sheet

import (
	"context"
	"testing"

	"github.com/bangdinh/cardflow-backend/internal/drive"
)

func TestService_CreateSpreadsheet_Validation(t *testing.T) {
	ctx := context.Background()
	store := drive.NewStore()
	svc := NewService(store)

	_, err := svc.CreateSpreadsheet(ctx, "", "My Sheet")
	if err == nil {
		t.Fatalf("expected error when state is empty")
	}

	_, err = svc.CreateSpreadsheet(ctx, "invalid-state", "My Sheet")
	if err == nil {
		t.Fatalf("expected error when state is not connected")
	}
}

func TestResolveRange_Fallback(t *testing.T) {
	// With nil srv, resolveRange should return default "Sheet1" when empty or unchanged target
	got := resolveRange(context.Background(), nil, "mock-id", "")
	if got != "Sheet1" {
		t.Errorf("expected Sheet1, got %s", got)
	}

	gotCustom := resolveRange(context.Background(), nil, "mock-id", "Summary!A1:B10")
	if gotCustom != "Summary!A1:B10" {
		t.Errorf("expected Summary!A1:B10, got %s", gotCustom)
	}
}
