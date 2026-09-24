package util

import (
	"context"
	"errors"
	"fmt"
	"runtime/debug"
	"sync"

	"go.uber.org/zap"
)

var (
	// ErrPoolClosed is returned when attempting to submit a task to a closed WorkerPool.
	ErrPoolClosed = errors.New("workerpool: pool is closed")
)

// WorkerPool manages a bounded number of concurrent tasks with automatic panic recovery.
type WorkerPool struct {
	sem    chan struct{}
	wg     sync.WaitGroup
	logger *zap.Logger
	mu     sync.Mutex
	closed bool
}

// NewWorkerPool creates a new WorkerPool with a maximum concurrency limit.
// If concurrency <= 0, defaults to 10.
func NewWorkerPool(concurrency int, logger *zap.Logger) *WorkerPool {
	if concurrency <= 0 {
		concurrency = 10
	}
	return &WorkerPool{
		sem:    make(chan struct{}, concurrency),
		logger: logger,
	}
}

// Submit enqueues and runs a task within the concurrency limit.
// If the pool is at capacity, Submit blocks until a worker slot is released.
// If the task panics, the panic is recovered and logged without crashing the process.
func (p *WorkerPool) Submit(task func()) error {
	return p.SubmitContext(context.Background(), task)
}

// SubmitContext enqueues a task respecting context cancellation while waiting for an available slot.
func (p *WorkerPool) SubmitContext(ctx context.Context, task func()) error {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return ErrPoolClosed
	}
	p.mu.Unlock()

	select {
	case p.sem <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}

	p.wg.Add(1)
	go func() {
		defer func() {
			<-p.sem
			p.wg.Done()
			if r := recover(); r != nil {
				err, ok := r.(error)
				if !ok {
					err = fmt.Errorf("%v", r)
				}
				p.logger.Error("workerpool: recovered from panic in task",
					zap.Error(err),
					zap.String("stacktrace", string(debug.Stack())),
				)
			}
		}()
		task()
	}()

	return nil
}

// Wait blocks until all currently executing tasks in the pool finish.
func (p *WorkerPool) Wait() {
	p.wg.Wait()
}

// Close marks the pool as closed and waits for all active tasks to complete.
func (p *WorkerPool) Close() {
	p.mu.Lock()
	p.closed = true
	p.mu.Unlock()
	p.wg.Wait()
}
