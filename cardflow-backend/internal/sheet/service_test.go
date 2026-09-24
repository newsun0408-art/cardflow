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

func TestExtractSpreadsheetID(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{
			input:    "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
			expected: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
		},
		{
			input:    "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0",
			expected: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
		},
		{
			input:    "https://docs.google.com/spreadsheets/d/1_ABC-xyz123/edit?usp=sharing",
			expected: "1_ABC-xyz123",
		},
	}

	for _, tc := range tests {
		got := ExtractSpreadsheetID(tc.input)
		if got != tc.expected {
			t.Errorf("ExtractSpreadsheetID(%q) = %q; expected %q", tc.input, got, tc.expected)
		}
	}
}

func TestCleanAndParseAmount(t *testing.T) {
	tests := []struct {
		raw          string
		typeHint     string
		expectedVal  float64
		expectedType string
	}{
		{"-55000", "", -55000, "expense"},
		{"150,000", "", 150000, "income"},
		{"150.000 ₫", "chi tiêu", -150000, "expense"},
		{"(50.000)", "", -50000, "expense"},
		{"+ 2.000.000 VND", "thu nhập", 2000000, "income"},
	}

	for _, tc := range tests {
		val, txType, err := cleanAndParseAmount(tc.raw, tc.typeHint)
		if err != nil {
			t.Errorf("cleanAndParseAmount(%q) failed: %v", tc.raw, err)
		}
		if val != tc.expectedVal || txType != tc.expectedType {
			t.Errorf("cleanAndParseAmount(%q) = (%v, %v); expected (%v, %v)", tc.raw, val, txType, tc.expectedVal, tc.expectedType)
		}
	}
}

func TestDetectHeaderRow_CardflowExport(t *testing.T) {
	rows := [][]interface{}{
		{"CARDFLOW - BÁO CÁO SAO KÊ GIAO DỊCH TÀI CHÍNH"},
		{"Chủ thẻ:", "LÊ HUỲNH THUẬN", "Thẻ áp dụng:", "Tất cả các thẻ", "Ngày xuất báo cáo:", "13:45:38 24/9/2026"},
		{"Tổng chi tiêu:", "20.090.000₫", "Tổng thu / Hoàn:", "500.000₫", "Biến động ròng:", "-19.590.000₫"},
		{},
		{"STT", "Mã GD", "Ngày GD", "Giờ GD", "Thẻ", "Đơn Vị Chấp Nhận (Merchant)", "Danh Mục", "Số Tiền (VND)", "Trạng Thái"},
		{"1", "TXN-9921-88412", "2026-09-22", "14:32", "•••• 9921", "Thế Giới Di Động - Laptop Pro", "Công nghệ", "-12500000", "Thành công"},
		{"2", "TXN-9921-88390", "2026-09-22", "09:15", "•••• 9921", "Starbucks Coffee Reserve", "Ăn uống", "-185000", "Thành công"},
	}

	idx, cols := detectHeaderRow(rows)
	if idx != 4 {
		t.Fatalf("expected header row index 4, got %d", idx)
	}

	if cols.refID != 1 {
		t.Errorf("expected cols.refID = 1, got %d", cols.refID)
	}
	if cols.amount != 7 {
		t.Errorf("expected cols.amount = 7, got %d", cols.amount)
	}
	if cols.merchant != 5 {
		t.Errorf("expected cols.merchant = 5, got %d", cols.merchant)
	}
}
