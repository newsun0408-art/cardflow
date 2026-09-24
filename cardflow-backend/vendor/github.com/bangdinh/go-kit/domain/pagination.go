package domain

import "github.com/bangdinh/go-kit/response"

const (
	// DefaultLimit is the default number of items per page when not specified.
	DefaultLimit = 20
	// MaxLimit is the maximum allowed items per page.
	MaxLimit = 100
)

// ClampLimit constrains limit to [1, max].
func ClampLimit(limit, max int) int {
	if limit < 1 {
		return 1
	}
	if limit > max {
		return max
	}
	return limit
}

// ParseSort parses a sort string like "-createdAt" into (field, order).
// A leading "-" means descending; "+" or no prefix means ascending.
// Returns ("", "") if raw is empty.
func ParseSort(raw string) (field string, order SortOrder) {
	if raw == "" {
		return "", ""
	}
	switch raw[0] {
	case '-':
		return raw[1:], SortOrderDesc
	case '+':
		return raw[1:], SortOrderAsc
	default:
		return raw, SortOrderAsc
	}
}

// CursorResult holds cursor-based pagination results.
type CursorResult[T any] struct {
	Items      []T
	NextCursor string
	HasMore    bool
}

// ToPage converts CursorResult to the shared HTTP success envelope (VMSN-STD-API-001 §06).
func (r CursorResult[T]) ToPage() response.Page[T] {
	return response.NewPage(r.Items, response.PageMeta{
		NextCursor: r.NextCursor,
		HasMore:    r.HasMore,
	})
}

type Cursor struct {
	Value string
}

func NewCursor(value string) Cursor {
	return Cursor{Value: value}
}

func (c Cursor) IsEmpty() bool {
	return c.Value == ""
}

func (c Cursor) String() string {
	return c.Value
}

type Offset struct {
	Value int
}

func NewOffset(value int) Offset {
	if value < 0 {
		value = 0
	}
	return Offset{Value: value}
}

func (o Offset) Int() int {
	return o.Value
}

type Page struct {
	Number int
	Size   int
}

func NewPage(number, size int) Page {
	if number < 1 {
		number = 1
	}
	if size < 1 {
		size = 10
	}
	return Page{
		Number: number,
		Size:   size,
	}
}

func (p Page) Offset() int {
	return (p.Number - 1) * p.Size
}

func (p Page) Limit() int {
	return p.Size
}
