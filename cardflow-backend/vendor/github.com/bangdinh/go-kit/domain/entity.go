// Package domain provides generic building blocks for domain entities.
//
// Each block is a standalone mixin — embed only what the entity needs:
//
//	type Table struct {
//	    ID   uuid.UUID          // service chooses ID type; see id.go for the
//	                           // recommended public identifier (ADR-0002)
//	    domain.Timestamps       // opt-in
//	    domain.Version          // opt-in
//	    domain.SoftDelete       // opt-in
//	    domain.AuditInfo        // opt-in
//	    domain.EventRecorder    // opt-in
//	    Name   string
//	    Status TableStatus
//	}
package domain

import "time"

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------

// Timestamps tracks when an entity was created and last modified.
type Timestamps struct {
	CreatedAt time.Time
	UpdatedAt time.Time
}

// NewTimestamps returns a Timestamps with both fields set to now.
func NewTimestamps() Timestamps {
	now := time.Now()
	return Timestamps{
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// Touch sets UpdatedAt to now.
func (t *Timestamps) Touch() {
	t.UpdatedAt = time.Now()
}

// ---------------------------------------------------------------------------
// Version (optimistic concurrency)
// ---------------------------------------------------------------------------

// Version tracks an entity's revision for optimistic concurrency control.
type Version struct {
	Value int64
}

// NewVersion returns a Version starting at 1.
func NewVersion() Version {
	return Version{Value: 1}
}

// Increment bumps the version by one.
func (v *Version) Increment() {
	v.Value++
}

// ---------------------------------------------------------------------------
// SoftDelete
// ---------------------------------------------------------------------------

// SoftDelete is a mixin for entities that support soft deletion.
type SoftDelete struct {
	DeletedAt *time.Time
}

// Delete marks the entity as deleted. Idempotent — calling it twice does
// not change the original deletion timestamp.
func (s *SoftDelete) Delete() {
	if s.DeletedAt == nil {
		now := time.Now()
		s.DeletedAt = &now
	}
}

// Restore un-deletes the entity.
func (s *SoftDelete) Restore() {
	s.DeletedAt = nil
}

// IsDeleted reports whether the entity has been soft-deleted.
func (s *SoftDelete) IsDeleted() bool {
	return s.DeletedAt != nil
}

// ---------------------------------------------------------------------------
// AuditInfo
// ---------------------------------------------------------------------------

// AuditInfo tracks who created and last updated an entity.
type AuditInfo struct {
	CreatedBy string
	UpdatedBy string
}

// NewAuditInfo creates an AuditInfo where both CreatedBy and UpdatedBy
// are set to the given actor (the creator is also the initial updater).
func NewAuditInfo(actor string) AuditInfo {
	return AuditInfo{
		CreatedBy: actor,
		UpdatedBy: actor,
	}
}

// SetUpdatedBy records the actor who last modified the entity.
// CreatedBy is never changed.
// Note: Named SetUpdatedBy instead of Touch to avoid method selector ambiguity
// when an entity embeds both domain.Timestamps (which defines Touch()) and domain.AuditInfo.
func (a *AuditInfo) SetUpdatedBy(actor string) {
	a.UpdatedBy = actor
}
