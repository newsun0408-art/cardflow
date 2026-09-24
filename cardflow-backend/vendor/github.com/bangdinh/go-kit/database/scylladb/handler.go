package scylladb

import (
	"context"
	"fmt"

	"github.com/gocql/gocql"
)

// ScyllaHandler wraps *gocql.Session and implements observability.HealthChecker.
type ScyllaHandler interface {
	Check(ctx context.Context) error
	Session() *gocql.Session
}

type scyllaHandler struct {
	session *gocql.Session
}

func (h *scyllaHandler) Session() *gocql.Session { return h.session }

func (h *scyllaHandler) Check(_ context.Context) error {
	if h.session.Closed() {
		return fmt.Errorf("scylladb: session is closed")
	}
	return nil
}
