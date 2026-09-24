package domain

// Specification is the generic specification interface for domain-layer filtering.
// Use it to define composable, testable business rules.
//
// Domain layer defines specs; infra layer may translate them to SQL/Mongo queries.
type Specification[T any] interface {
	IsSatisfiedBy(candidate T) bool
}

// SpecFunc is a convenience adapter that turns a plain function into a Specification.
//
//	isActive := domain.SpecFunc[Table](func(t Table) bool { return t.Status == "active" })
type SpecFunc[T any] func(T) bool

func (f SpecFunc[T]) IsSatisfiedBy(candidate T) bool {
	return f(candidate)
}

// And returns a Specification satisfied only when all given specs are satisfied.
// An empty And is vacuously true.
func And[T any](specs ...Specification[T]) Specification[T] {
	return andSpec[T]{specs: specs}
}

type andSpec[T any] struct {
	specs []Specification[T]
}

func (s andSpec[T]) IsSatisfiedBy(candidate T) bool {
	for _, spec := range s.specs {
		if !spec.IsSatisfiedBy(candidate) {
			return false
		}
	}
	return true
}

// Or returns a Specification satisfied when at least one given spec is satisfied.
// An empty Or is always false.
func Or[T any](specs ...Specification[T]) Specification[T] {
	return orSpec[T]{specs: specs}
}

type orSpec[T any] struct {
	specs []Specification[T]
}

func (s orSpec[T]) IsSatisfiedBy(candidate T) bool {
	for _, spec := range s.specs {
		if spec.IsSatisfiedBy(candidate) {
			return true
		}
	}
	return false
}

// Not returns a Specification that inverts the given spec.
func Not[T any](spec Specification[T]) Specification[T] {
	return notSpec[T]{spec: spec}
}

type notSpec[T any] struct {
	spec Specification[T]
}

func (s notSpec[T]) IsSatisfiedBy(candidate T) bool {
	return !s.spec.IsSatisfiedBy(candidate)
}

// FilterBy returns a new slice containing only items that satisfy the spec.
// Returns nil if items is nil.
func FilterBy[T any](items []T, spec Specification[T]) []T {
	if items == nil {
		return nil
	}
	var result []T
	for _, item := range items {
		if spec.IsSatisfiedBy(item) {
			result = append(result, item)
		}
	}
	return result
}
