package util

import "golang.org/x/sync/singleflight"

// Group represents a class of work and forms a namespace in which
// units of work can be executed with duplicate suppression (deduplication).
type Group[T any] struct {
	group singleflight.Group
}

// Result holds the result of a singleflight execution.
type Result[T any] struct {
	Val    T
	Err    error
	Shared bool
}

// NewSingleflightGroup creates a new generic singleflight Group.
func NewSingleflightGroup[T any]() *Group[T] {
	return &Group[T]{}
}

// Do executes and returns the results of the given function, making
// sure that only one execution is in-flight for a given key at a
// time. If a duplicate comes in, the duplicate caller waits for the
// original to complete and receives the same results.
// The return value shared indicates whether v was given to multiple callers.
func (g *Group[T]) Do(key string, fn func() (T, error)) (T, error, bool) {
	v, err, shared := g.group.Do(key, func() (any, error) {
		return fn()
	})
	if err != nil {
		var zero T
		return zero, err, shared
	}
	return v.(T), nil, shared
}

// Forget tells the singleflight to forget about a key. Future calls
// to Do for this key will call the function rather than waiting for
// an earlier call to complete.
func (g *Group[T]) Forget(key string) {
	g.group.Forget(key)
}
