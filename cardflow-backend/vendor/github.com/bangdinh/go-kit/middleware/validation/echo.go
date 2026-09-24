package validation

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"reflect"

	apperrors "github.com/bangdinh/go-kit/errors"
	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/otel/trace"
)

// BindAndValidate validates the raw Echo request against cfg schemas, then binds
// the result into T using per-namespace JSON decoding.
//
// T must have Body, Query, and/or Params sub-struct fields (matching MustConfig[T]).
// Each sub-struct is populated independently:
//   - Body ← JSON-decoded from the request body
//   - Query ← JSON-decoded from query param map
//   - Params ← JSON-decoded from path param map
//
// On validation failure: writes a 422 ProblemDetail via c.JSON, then returns
// echo.ErrBadRequest. The response is committed before returning, so Echo's global
// error handler skips the double-write.
func BindAndValidate[T any](c echo.Context, cfg Config) (*T, error) {
	bodyBytes, err := readBody(c)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "cannot read request body")
	}

	queryVals := extractQueryParams(c)
	paramVals := extractPathParams(c)

	errs, err := ValidateRequestDetailed(bodyBytes, queryVals, paramVals, cfg)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if len(errs) > 0 {
		traceID := extractTraceID(c)
		problem := apperrors.ValidationProblemFields(errs, traceID)
		c.Response().Header().Set("Content-Type", apperrors.ProblemContentType)
		if writeErr := c.JSON(http.StatusUnprocessableEntity, problem); writeErr != nil {
			return nil, writeErr
		}
		return nil, echo.ErrBadRequest
	}

	var v T
	if err := bindSubstructs(&v, bodyBytes, queryVals, paramVals, cfg); err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return &v, nil
}

// New returns an Echo middleware that validates the request against cfg schemas
// and short-circuits with 422 ProblemDetail on failure. The body is buffered and
// restored so downstream handlers can still call c.Bind().
func New(cfg Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			bodyBytes, err := readBody(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "cannot read request body")
			}

			queryVals := extractQueryParams(c)
			paramVals := extractPathParams(c)

			errs, err := ValidateRequestDetailed(bodyBytes, queryVals, paramVals, cfg)
			if err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
			}
			if len(errs) > 0 {
				traceID := extractTraceID(c)
				problem := apperrors.ValidationProblemFields(errs, traceID)
				c.Response().Header().Set("Content-Type", apperrors.ProblemContentType)
				if writeErr := c.JSON(http.StatusUnprocessableEntity, problem); writeErr != nil {
					return writeErr
				}
				return echo.ErrBadRequest
			}

			c.Request().Body = io.NopCloser(bytes.NewReader(bodyBytes))
			return next(c)
		}
	}
}

// bindSubstructs populates the Body, Query, and Params sub-fields of v by
// JSON-decoding each source independently. Query and Params string values are
// coerced to their schema-declared types before decoding. Missing sub-fields are
// skipped silently.
func bindSubstructs(v any, bodyBytes []byte, queryVals, paramVals map[string]string, cfg Config) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	rt := rv.Type()

	for i := range rt.NumField() {
		field := rt.Field(i)
		fv := rv.Field(i)
		if !fv.CanSet() {
			continue
		}

		var raw []byte
		switch field.Name {
		case "Body":
			raw = bodyBytes
		case "Query":
			if cfg.QuerySchema == nil {
				continue
			}
			coerced, err := CoerceParams(queryVals, cfg.QuerySchema, nil)
			if err != nil {
				return err
			}
			b, err := json.Marshal(coerced)
			if err != nil {
				return err
			}
			raw = b
		case "Params":
			if cfg.ParamsSchema == nil {
				continue
			}
			coerced, err := CoerceParams(paramVals, cfg.ParamsSchema, nil)
			if err != nil {
				return err
			}
			b, err := json.Marshal(coerced)
			if err != nil {
				return err
			}
			raw = b
		default:
			continue
		}

		ptr := reflect.New(field.Type)
		if err := json.Unmarshal(raw, ptr.Interface()); err != nil {
			return err
		}
		fv.Set(ptr.Elem())
	}
	return nil
}

func readBody(c echo.Context) ([]byte, error) {
	if c.Request().Body == nil {
		return []byte("{}"), nil
	}
	b, err := io.ReadAll(c.Request().Body)
	_ = c.Request().Body.Close()
	if err != nil {
		return nil, err
	}
	if len(b) == 0 {
		return []byte("{}"), nil
	}
	return b, nil
}

func extractQueryParams(c echo.Context) map[string]string {
	vals := c.QueryParams()
	out := make(map[string]string, len(vals))
	for k, v := range vals {
		if len(v) > 0 {
			out[k] = v[0]
		}
	}
	return out
}

func extractPathParams(c echo.Context) map[string]string {
	names := c.ParamNames()
	out := make(map[string]string, len(names))
	for _, n := range names {
		out[n] = c.Param(n)
	}
	return out
}

// extractTraceID gets the OTel trace ID or falls back to X-Request-Id.
func extractTraceID(c echo.Context) string {
	span := trace.SpanFromContext(c.Request().Context())
	sc := span.SpanContext()
	if sc.HasTraceID() {
		return sc.TraceID().String()
	}
	return c.Response().Header().Get("X-Request-Id")
}
