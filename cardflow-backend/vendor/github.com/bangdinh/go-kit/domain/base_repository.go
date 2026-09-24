// Package domain provides the generic Repository[T, ID] base interface.
//
// Each service's feature package should embed or compose this interface to
// define its own repository contract. The base interface covers the standard
// CRUD + List operations that virtually every resource needs.
//
// Usage in a feature package:
//
//	type WidgetRepository interface {
//	    domain.Repository[Widget, uuid.UUID]
//	    // Add feature-specific queries here:
//	    FindByColor(ctx context.Context, color string) ([]Widget, error)
//	}
package domain

import "context"

// Repository is the generic base repository interface.
// T is the entity type. ID is the identifier type (uuid.UUID, int64, string, etc.).
type Repository[T any, ID comparable] interface {
	// Create persists a new entity and returns it (with generated fields populated).
	Create(ctx context.Context, entity *T) error

	// GetByID retrieves a single entity by its identifier.
	// Returns ErrNotFound if the entity does not exist.
	GetByID(ctx context.Context, id ID) (*T, error)

	// Update persists changes to an existing entity.
	// Returns ErrNotFound if the entity does not exist.
	Update(ctx context.Context, entity *T) error

	// Delete removes an entity by its identifier.
	// Returns ErrNotFound if the entity does not exist.
	Delete(ctx context.Context, id ID) error

	// List returns a paginated list of entities matching the filter.
	List(ctx context.Context, filter Filter) (PaginatedResult[T], error)
}

// ReadRepository is a read-only subset of Repository for CQRS read-side or
// reporting use cases.
type ReadRepository[T any, ID comparable] interface {
	GetByID(ctx context.Context, id ID) (*T, error)
	List(ctx context.Context, filter Filter) (PaginatedResult[T], error)
}

// WriteRepository is a write-only subset of Repository for CQRS write-side.
type WriteRepository[T any, ID comparable] interface {
	Create(ctx context.Context, entity *T) error
	Update(ctx context.Context, entity *T) error
	Delete(ctx context.Context, id ID) error
}
