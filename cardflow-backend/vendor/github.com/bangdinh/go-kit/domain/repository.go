package domain

import "github.com/bangdinh/go-kit/response"

type Filter struct {
	Limit   int
	Offset  int
	OrderBy string
	Order   SortOrder
}

type SortOrder string

const (
	SortOrderAsc  SortOrder = "ASC"
	SortOrderDesc SortOrder = "DESC"
)

func NewFilter(limit, offset int) Filter {
	return Filter{
		Limit:  limit,
		Offset: offset,
		Order:  SortOrderAsc,
	}
}

func (f Filter) WithOrderBy(field string, order SortOrder) Filter {
	f.OrderBy = field
	f.Order = order
	return f
}

// Repository[T, ID] is now defined in base_repository.go as a generic base
// interface. Each service's feature package can embed it and add custom queries.
// See also cmd/scaffold/templates/internal/__resource__/repository.go.tmpl

type PaginatedResult[T any] struct {
	Items    []T
	Total    int64
	Page     int
	PageSize int
	HasNext  bool
	HasPrev  bool
}

func NewPaginatedResult[T any](items []T, total int64, page, pageSize int) PaginatedResult[T] {
	return PaginatedResult[T]{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		HasNext:  int64(page*pageSize) < total,
		HasPrev:  page > 1,
	}
}

// ToPage converts PaginatedResult to the shared HTTP success envelope (VMSN-STD-API-001 §06).
// Offset-based pagination has no cursor (NextCursor stays empty) but exposes Total.
func (r PaginatedResult[T]) ToPage() response.Page[T] {
	total := r.Total
	return response.NewPage(r.Items, response.PageMeta{
		Limit:   r.PageSize,
		HasMore: r.HasNext,
		Total:   &total,
	})
}
