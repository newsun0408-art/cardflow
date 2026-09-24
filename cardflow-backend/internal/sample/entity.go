package sample

import (
	"github.com/bangdinh/go-kit/domain"
)

// Sample is the domain entity.
// Embed go-kit mixins as needed; the service chooses the ID type.
type Sample struct {
	ID   string
	Name string
	domain.Timestamps
	// TODO: add fields, embed domain.Version / domain.SoftDelete if needed
}
