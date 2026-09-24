package validation

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"unicode"

	apperrors "github.com/bangdinh/go-kit/errors"
	"github.com/santhosh-tekuri/jsonschema/v6"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

var defaultPrinter = message.NewPrinter(language.English)

// schemaCache compiles JSON Schema bytes once per unique content hash and caches
// the result. Subsequent lookups are served from the sync.Map with no locking.
type schemaCache struct {
	m sync.Map
}

func (c *schemaCache) compile(raw []byte) (*jsonschema.Schema, error) {
	sum := sha256.Sum256(raw)
	key := fmt.Sprintf("%x", sum)

	if v, ok := c.m.Load(key); ok {
		return v.(*jsonschema.Schema), nil
	}

	doc, err := jsonschema.UnmarshalJSON(bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("unmarshalling schema: %w", err)
	}

	compiler := jsonschema.NewCompiler()
	url := fmt.Sprintf("https://schema.internal/%s", key)
	if err := compiler.AddResource(url, doc); err != nil {
		return nil, fmt.Errorf("adding schema resource: %w", err)
	}
	s, err := compiler.Compile(url)
	if err != nil {
		return nil, fmt.Errorf("compiling schema: %w", err)
	}

	actual, _ := c.m.LoadOrStore(key, s)
	return actual.(*jsonschema.Schema), nil
}

var globalCache = &schemaCache{}

// validateNamespace compiles (or fetches) the schema for schemaBytes and
// validates data against it. Returns a flat map of {field → message} for each
// leaf error in the validation tree. Returns nil if validation passes.
func validateNamespace(data any, schemaBytes []byte) (map[string]fieldIssue, error) {
	compiled, err := globalCache.compile(schemaBytes)
	if err != nil {
		return nil, err
	}

	err = compiled.Validate(data)
	if err == nil {
		return nil, nil
	}

	var ve *jsonschema.ValidationError
	if !errors.As(err, &ve) {
		return nil, fmt.Errorf("unexpected validation error type: %w", err)
	}

	errs := make(map[string]fieldIssue)
	flattenErrors(ve, errs)
	return errs, nil
}

// flattenErrors walks the ValidationError tree depth-first and collects leaf
// errors into out. The map key is the dot-joined InstanceLocation segments
// (e.g. ["age"] → "age"; [] → "$root").
func flattenErrors(ve *jsonschema.ValidationError, out map[string]fieldIssue) {
	if len(ve.Causes) == 0 {
		loc := strings.Join(ve.InstanceLocation, ".")
		if loc == "" {
			loc = "$root"
		}
		if _, exists := out[loc]; !exists {
			out[loc] = fieldIssue{
				Code:   keywordToCode(ve.ErrorKind.KeywordPath()),
				Reason: ve.ErrorKind.LocalizedString(defaultPrinter),
			}
		}
		return
	}
	for _, cause := range ve.Causes {
		flattenErrors(cause, out)
	}
}

// fieldIssue is one validation failure: a stable UPPER_SNAKE code + human reason.
type fieldIssue struct {
	Code   string
	Reason string
}

// keywordToCode maps a JSON-schema keyword path (e.g. ["required"], ["minLength"])
// to a stable UPPER_SNAKE per-field code (REQUIRED, MIN_LENGTH). Empty -> INVALID.
func keywordToCode(path []string) string {
	if len(path) == 0 {
		return "INVALID"
	}
	var b strings.Builder
	for i, r := range path[len(path)-1] {
		if i > 0 && unicode.IsUpper(r) {
			b.WriteByte('_')
		}
		b.WriteRune(unicode.ToUpper(r))
	}
	if b.Len() == 0 {
		return "INVALID"
	}
	return b.String()
}

// validateRequestIssues validates body, query params, and path params against
// their schemas, returning "namespace.field" -> fieldIssue (code + reason), or
// nil if every enabled namespace passes.
func validateRequestIssues(
	bodyBytes []byte,
	queryVals map[string]string,
	paramVals map[string]string,
	cfg Config,
) (map[string]fieldIssue, error) {
	allErrs := make(map[string]fieldIssue)

	// Build strict-field sets per namespace.
	queryStrict := make(map[string]bool)
	paramsStrict := make(map[string]bool)
	for _, s := range cfg.StrictTypes {
		ns, field, ok := strings.Cut(s, ".")
		if !ok {
			continue
		}
		switch ns {
		case "query":
			queryStrict[field] = true
		case "params":
			paramsStrict[field] = true
		}
	}

	// Validate body.
	if cfg.BodySchema != nil {
		if len(bodyBytes) == 0 {
			bodyBytes = []byte("{}")
		}
		dec := json.NewDecoder(bytes.NewReader(bodyBytes))
		dec.UseNumber()
		var bodyData any
		if err := dec.Decode(&bodyData); err != nil {
			return nil, fmt.Errorf("parsing request body: %w", err)
		}
		errs, err := validateNamespace(bodyData, cfg.BodySchema)
		if err != nil {
			return nil, err
		}
		for k, v := range errs {
			if k == "$root" {
				allErrs["body"] = v
			} else {
				allErrs["body."+k] = v
			}
		}
	}

	// Validate query params.
	if cfg.QuerySchema != nil {
		coerced, err := CoerceParams(queryVals, cfg.QuerySchema, queryStrict)
		if err != nil {
			return nil, fmt.Errorf("coercing query params: %w", err)
		}
		errs, err := validateNamespace(coerced, cfg.QuerySchema)
		if err != nil {
			return nil, err
		}
		for k, v := range errs {
			if k == "$root" {
				allErrs["query"] = v
			} else {
				allErrs["query."+k] = v
			}
		}
	}

	// Validate path params.
	if cfg.ParamsSchema != nil {
		coerced, err := CoerceParams(paramVals, cfg.ParamsSchema, paramsStrict)
		if err != nil {
			return nil, fmt.Errorf("coercing path params: %w", err)
		}
		errs, err := validateNamespace(coerced, cfg.ParamsSchema)
		if err != nil {
			return nil, err
		}
		for k, v := range errs {
			if k == "$root" {
				allErrs["params"] = v
			} else {
				allErrs["params."+k] = v
			}
		}
	}

	if len(allErrs) == 0 {
		return nil, nil
	}
	return allErrs, nil
}

// ValidateRequest returns a field -> reason map (backward-compatible view).
func ValidateRequest(bodyBytes []byte, queryVals, paramVals map[string]string, cfg Config) (map[string]string, error) {
	issues, err := validateRequestIssues(bodyBytes, queryVals, paramVals, cfg)
	if err != nil || issues == nil {
		return nil, err
	}
	out := make(map[string]string, len(issues))
	for field, iss := range issues {
		out[field] = iss.Reason
	}
	return out, nil
}

// ValidateRequestDetailed returns per-field errors with stable UPPER_SNAKE codes,
// sorted by field for deterministic output. Feed directly to
// apperrors.ValidationProblemFields.
func ValidateRequestDetailed(bodyBytes []byte, queryVals, paramVals map[string]string, cfg Config) ([]apperrors.FieldError, error) {
	issues, err := validateRequestIssues(bodyBytes, queryVals, paramVals, cfg)
	if err != nil || issues == nil {
		return nil, err
	}
	out := make([]apperrors.FieldError, 0, len(issues))
	for field, iss := range issues {
		out = append(out, apperrors.FieldError{Field: field, Code: iss.Code, Reason: iss.Reason})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Field < out[j].Field })
	return out, nil
}
