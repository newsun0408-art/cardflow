package validation

import (
	"encoding/json"
	"fmt"
	"strconv"
)

// extractPropertyTypes parses the top-level "properties" of a JSON Schema and
// returns a map of {propertyName → schemaType}. Only the first declared type is
// returned for each property; arrays of types are not handled.
func extractPropertyTypes(schemaBytes []byte) (map[string]string, error) {
	var s struct {
		Properties map[string]struct {
			Type string `json:"type"`
		} `json:"properties"`
	}
	if err := json.Unmarshal(schemaBytes, &s); err != nil {
		return nil, fmt.Errorf("parsing schema for coercion: %w", err)
	}
	types := make(map[string]string, len(s.Properties))
	for k, v := range s.Properties {
		types[k] = v.Type
	}
	return types, nil
}

// CoerceParams converts raw string query/path param values to their JSON-native
// equivalents based on the schema's declared property types.
//
// Fields listed in strict are left as strings regardless of schema type.
// Numeric types are returned as json.Number so that santhosh-tekuri/jsonschema/v6
// integer and number checks work correctly. Fields with unrecognised schema types
// or failed conversions are left as strings for the schema validator to reject.
func CoerceParams(raw map[string]string, schemaBytes []byte, strict map[string]bool) (map[string]any, error) {
	types, err := extractPropertyTypes(schemaBytes)
	if err != nil {
		return nil, err
	}

	result := make(map[string]any, len(raw))
	for k, v := range raw {
		if strict[k] {
			result[k] = v
			continue
		}
		switch types[k] {
		case "integer":
			if _, err := strconv.ParseInt(v, 10, 64); err == nil {
				result[k] = json.Number(v)
			} else {
				result[k] = v // leave as string; schema validator will reject
			}
		case "number":
			if _, err := strconv.ParseFloat(v, 64); err == nil {
				result[k] = json.Number(v)
			} else {
				result[k] = v
			}
		case "boolean":
			b, err := strconv.ParseBool(v)
			if err != nil {
				result[k] = v
			} else {
				result[k] = b
			}
		default:
			result[k] = v
		}
	}
	return result, nil
}
