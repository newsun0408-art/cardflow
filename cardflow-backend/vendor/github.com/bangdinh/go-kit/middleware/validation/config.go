package validation

import (
	"reflect"
)

// Config holds per-namespace JSON schemas and coercion settings for Echo validation.
// All schema fields are optional — a nil schema skips validation for that namespace.
type Config struct {
	BodySchema   []byte
	QuerySchema  []byte
	ParamsSchema []byte

	// StrictTypes lists "namespace.field" paths (e.g. "params.tenant_id") whose
	// raw string values must NOT be coerced. All other query/path params are
	// auto-coerced to the type declared in the schema.
	StrictTypes []string
}

// GRPCConfig holds the schema for a gRPC request message.
type GRPCConfig struct {
	Schema      []byte
	StrictTypes []string // kept for API consistency; rarely needed in gRPC
}

// MustConfig derives a Config by reflecting on the Body, Query, and Params
// fields of T. Each present sub-struct is passed to MustFromStruct to generate
// its JSON Schema. Missing sub-structs leave the corresponding schema nil.
// Panics if schema generation fails — safe for package-level var initialization.
func MustConfig[T any]() Config {
	var zero T
	t := reflect.TypeOf(zero)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	cfg := Config{}
	if f, ok := t.FieldByName("Body"); ok {
		cfg.BodySchema = MustFromStruct(reflect.New(f.Type).Interface())
	}
	if f, ok := t.FieldByName("Query"); ok {
		cfg.QuerySchema = MustFromStruct(reflect.New(f.Type).Interface())
	}
	if f, ok := t.FieldByName("Params"); ok {
		cfg.ParamsSchema = MustFromStruct(reflect.New(f.Type).Interface())
	}
	return cfg
}
