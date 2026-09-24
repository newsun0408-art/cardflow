package sample

import "context"

// Repository is the port for Sample persistence.
// Defined in the feature package; implemented by store.go / cache.go.
type Repository interface {
	Create(ctx context.Context, e Sample) error
	GetByID(ctx context.Context, id string) (Sample, error)
	// TODO: add domain operations (List, Update, Delete)
}
