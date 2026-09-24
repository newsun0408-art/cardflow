package validation

import (
	"encoding/json"
	"fmt"
	"reflect"

	"github.com/invopop/jsonschema"
)

// FromStruct generates a JSON Schema Draft 2020-12 document from a Go struct.
// The value v must be a pointer to a struct. The $id field is stripped from the
// output to prevent URL conflicts when adding the schema to the compiler.
func FromStruct(v any) ([]byte, error) {
	// Validate that v is a pointer to a struct
	t := reflect.TypeOf(v)
	if t == nil || t.Kind() != reflect.Ptr {
		return nil, fmt.Errorf("FromStruct: input must be a pointer, got %v", t)
	}
	if t.Elem().Kind() != reflect.Struct {
		return nil, fmt.Errorf("FromStruct: input must be pointer to struct, got pointer to %v", t.Elem().Kind())
	}

	// RequiredFromJSONSchemaTags=true: only fields tagged `jsonschema:"required"` are
	// listed in the schema's "required" array. Without this, invopop/jsonschema treats
	// every non-omitempty JSON field as required, which rejects valid optional-field requests.
	r := &jsonschema.Reflector{DoNotReference: true, RequiredFromJSONSchemaTags: true}
	s := r.Reflect(v)

	raw, err := json.Marshal(s)
	if err != nil {
		return nil, fmt.Errorf("marshalling schema: %w", err)
	}

	// Strip $id to avoid URL conflicts in santhosh-tekuri/jsonschema compiler.
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, fmt.Errorf("unmarshalling schema: %w", err)
	}
	delete(m, "$id")

	return json.Marshal(m)
}

// MustFromStruct calls FromStruct and panics on error.
// Safe for use in package-level var blocks.
func MustFromStruct(v any) []byte {
	b, err := FromStruct(v)
	if err != nil {
		panic(fmt.Sprintf("validation.MustFromStruct: %v", err))
	}
	return b
}
