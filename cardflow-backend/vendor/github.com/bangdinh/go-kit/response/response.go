// Package response provides the standard HTTP success envelope shared by ALL
// go-kit services (VMSN-STD-API-001 §06). It is the single source of truth
// for the success response shape — services import this package rather than
// copying the types.
//
// Errors are handled separately by the RFC 9457 ProblemDetail in package errors:
// success and error shapes are never mixed (no code/status in success bodies,
// no data in error bodies).
package response

// Data is the success envelope for a single resource: {"data": {...}}.
type Data[T any] struct {
	Data T `json:"data"`
}

// NewData wraps a single resource in the success envelope.
func NewData[T any](v T) Data[T] { return Data[T]{Data: v} }

// PageMeta holds cursor-pagination metadata (§06): limit, nextCursor, hasMore;
// total is optional and only set when it can be computed at acceptable cost.
type PageMeta struct {
	Limit      int    `json:"limit,omitempty"`
	NextCursor string `json:"nextCursor,omitempty"`
	HasMore    bool   `json:"hasMore"`
	Total      *int64 `json:"total,omitempty"`
}

// Page is the success envelope for a collection: {"data": [...], "page": {...}}.
// An empty collection renders "data": [] (200), never 404.
type Page[T any] struct {
	Data []T      `json:"data"`
	Page PageMeta `json:"page"`
}

// NewPage wraps a collection in the success envelope. A nil slice renders as [].
func NewPage[T any](items []T, meta PageMeta) Page[T] {
	if items == nil {
		items = []T{}
	}
	return Page[T]{Data: items, Page: meta}
}
