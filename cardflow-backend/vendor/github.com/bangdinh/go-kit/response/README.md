# response

Standard HTTP **success** envelope shared by all go-kit services
(VMSN-STD-API-001 §06). Single source of truth — services import this package
instead of copying the types. Errors are handled separately by
[`errors.ProblemDetail`](../errors) (RFC 9457); success and error shapes are
never mixed.

## Types

| Type | Shape | Use |
|------|-------|-----|
| `Data[T]` | `{"data": {...}}` | single resource |
| `Page[T]` | `{"data": [...], "page": {...}}` | collection |
| `PageMeta` | `{limit, nextCursor?, hasMore, total?}` | cursor pagination metadata |

## Usage

```go
import "github.com/bangdinh/go-kit/response"

// single resource — 200 / 201
return c.JSON(http.StatusOK, response.NewData(dto))          // {"data": {...}}

// created — 201 + Location
c.Response().Header().Set("Location", "/api/v1/orders/"+dto.ID)
return c.JSON(http.StatusCreated, response.NewData(dto))

// collection — 200 (empty collection renders "data": [], never 404)
return c.JSON(http.StatusOK, response.NewPage(items, response.PageMeta{
    Limit:      50,
    NextCursor: nextCursor,
    HasMore:    hasMore,
}))

// no content — 204 (no body)
return c.NoContent(http.StatusNoContent)
```

`domain.CursorResult[T].ToPage()` and `domain.PaginatedResult[T].ToPage()` build
a `response.Page[T]` directly from repository pagination results.

## Rules (§06)

- Do **not** add `success` / `codeStatus` / `message` — the HTTP status already
  describes the result.
- Never return `{"data": null}` just to keep the envelope on a 204.
- Errors are **not** wrapped here — handlers `return err`; the central Echo error
  handler renders an RFC 9457 `ProblemDetail`.
