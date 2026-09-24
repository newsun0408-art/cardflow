package domain

import "time"

// DomainEvent represents something that happened in the domain.
// Concrete events embed BaseEvent and add their own fields.
type DomainEvent interface {
	EventName() string
	OccurredAt() time.Time
}

// BaseEvent provides the common fields every domain event needs.
// Embed it in concrete event structs:
//
//	type TableOpened struct {
//	    domain.BaseEvent
//	    TableID string
//	}
type BaseEvent struct {
	name       string
	occurredAt time.Time
}

// NewBaseEvent creates a BaseEvent stamped with the current time.
func NewBaseEvent(name string) BaseEvent {
	return BaseEvent{
		name:       name,
		occurredAt: time.Now(),
	}
}

func (e BaseEvent) EventName() string    { return e.name }
func (e BaseEvent) OccurredAt() time.Time { return e.occurredAt }

// EventRecorder collects domain events raised during a business operation.
// Embed it in an entity (or aggregate root) so the entity can record events
// and the service layer can retrieve and dispatch them after committing.
//
//	type Table struct {
//	    ID string
//	    domain.Timestamps
//	    domain.EventRecorder
//	    Name string
//	}
//
//	func (t *Table) Open() {
//	    t.RecordEvent(TableOpenedEvent{...})
//	}
type EventRecorder struct {
	events []DomainEvent
}

// RecordEvent appends an event to the recorder.
func (r *EventRecorder) RecordEvent(event DomainEvent) {
	r.events = append(r.events, event)
}

// Events returns all recorded events in order.
func (r *EventRecorder) Events() []DomainEvent {
	return r.events
}

// ClearEvents removes all recorded events. Call this after dispatching.
func (r *EventRecorder) ClearEvents() {
	r.events = nil
}
