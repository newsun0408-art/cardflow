# middleware/validation — Validate bằng JSON Schema

Package `validation` cung cấp middleware validate request cho HTTP server Echo và service gRPC. Nó validate body, query parameter và path parameter theo JSON Schema Draft 2020-12 trước khi handler chạy.

Import path: `github.com/bangdinh/go-kit/middleware/validation`

Không cần `go get` — package nằm trong cùng module.

---

## Public API

| Symbol | Mô tả |
|--------|-------------|
| `FromStruct(v any) ([]byte, error)` | Sinh JSON Schema từ con trỏ struct Go |
| `MustFromStruct(v any) []byte` | Như `FromStruct`, panic nếu lỗi — an toàn cho khởi tạo `var` |
| `MustConfig[T any]() Config` | Suy ra `Config` từ các sub-struct `T.Body`, `T.Query`, `T.Params` |
| `BindAndValidate[T any](c echo.Context, cfg Config) (*T, error)` | Validate + bind trong một bước (API chính) |
| `New(cfg Config) echo.MiddlewareFunc` | Biến thể middleware — validate rồi khôi phục body cho `c.Bind()` |
| `NewGRPCInterceptor(cfg GRPCConfig) grpc.UnaryServerInterceptor` | Validate message gRPC unary |
| `NewGRPCStreamInterceptor(cfg GRPCConfig) grpc.StreamServerInterceptor` | Validate message gRPC streaming |

---

## Types

### `Config`

```go
type Config struct {
    BodySchema   []byte   // JSON Schema for the request body; nil = skip
    QuerySchema  []byte   // JSON Schema for query parameters; nil = skip
    ParamsSchema []byte   // JSON Schema for path parameters; nil = skip
    StrictTypes  []string // "namespace.field" paths to skip type coercion
}
```

### `GRPCConfig`

```go
type GRPCConfig struct {
    Schema      []byte   // JSON Schema for the request message; nil = skip
    StrictTypes []string // kept for API consistency; rarely needed in gRPC
}
```

### ProblemDetail (lỗi validate)

Khi validate thất bại, response là **422 ProblemDetail** (RFC 9457, `Content-Type: application/problem+json`) — **cùng một format** với mọi lỗi khác trong hệ, không còn body riêng. Field lỗi nằm ở mảng `errors` (`errors/problem.go`, dựng qua `apperrors.ValidationProblemFields`):

```go
type ProblemDetail struct {
    Type    string       `json:"type"`              // "about:blank"
    Title   string       `json:"title"`             // "Validation failed"
    Status  int          `json:"status"`            // 422
    Code    Code         `json:"code"`              // "VALIDATION_FAILED"
    TraceID string       `json:"traceId,omitempty"`
    Errors  []FieldError `json:"errors,omitempty"`
}

type FieldError struct {
    Field  string `json:"field"`
    Code   string `json:"code,omitempty"`  // per-field code UPPER_SNAKE, vd REQUIRED
    Reason string `json:"reason"`
}
```

Ví dụ:

```json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "traceId": "…",
  "errors": [
    { "field": "body.name", "code": "REQUIRED", "reason": "name is required" },
    { "field": "query.page", "code": "MINIMUM", "reason": "must be >= 1" }
  ]
}
```

---

## Quy ước request model

Định nghĩa một struct với các sub-struct `Body`, `Query`, `Params`. Dùng tag `jsonschema` để khai báo ràng buộc.

```go
type CreateUserRequest struct {
    Body struct {
        Name string `json:"name" jsonschema:"required,minLength=1"`
        Age  int    `json:"age"  jsonschema:"minimum=0"`
    }
    Query struct {
        Page int `json:"page" jsonschema:"minimum=1"`
    }
    Params struct {
        TenantID string `json:"tenant_id" jsonschema:"required"`
    }
}
```

Sinh `Config` một lần lúc init package:

```go
var createUserCfg = validation.MustConfig[CreateUserRequest]()
```

`MustConfig[T]` reflect trên `T`, tìm từng sub-struct trong ba cái, và gọi `MustFromStruct` cho mỗi cái. Schema được compile và cache theo sha256 ở lần dùng đầu tiên — không bao giờ compile mỗi request.

---

## `BindAndValidate[T]` — API chính

Dùng cái này trong handler khi muốn validate và bind trong một lời gọi.

```go
func (h *Handler) CreateUser(c echo.Context) error {
    req, err := validation.BindAndValidate[CreateUserRequest](c, createUserCfg)
    if err != nil {
        return err  // 422 already written; just propagate
    }
    // req.Body.Name, req.Body.Age, req.Query.Page, req.Params.TenantID are populated
    return c.JSON(http.StatusCreated, req)
}
```

Khi validate thất bại, `BindAndValidate` ghi **422 ProblemDetail** (`application/problem+json`) qua `c.JSON`, rồi trả về `echo.ErrBadRequest`. Response đã commit trước khi return nên central error handler bỏ qua ghi trùng — handler chỉ cần trả error nguyên trạng. (Đọc body lỗi / bind lỗi → `400`; lỗi compile schema nội bộ → `500`.)

---

## `New` — biến thể middleware

Dùng `New` khi muốn validate như middleware ở mức route-group và handler phía sau vẫn gọi `c.Bind()`.

```go
func setupRoutes(e *echo.Echo, h *Handler) {
    users := e.Group("/users", validation.New(createUserCfg))
    users.POST("", h.CreateUser)
}
```

`New` buffer body, validate, rồi khôi phục `c.Request().Body` để `c.Bind()` vẫn hoạt động bình thường. Khi thất bại nó ghi **422 ProblemDetail** và short-circuit — handler không bao giờ được gọi.

---

## `StrictTypes` — bỏ qua ép kiểu

Query parameter và path parameter đến dưới dạng string. Middleware tự ép chúng về type khai báo trong schema (integer, number, boolean). Dùng `StrictTypes` để loại một field khỏi việc ép kiểu và giữ nguyên string thô.

```go
var cfg = validation.Config{
    ParamsSchema: validation.MustFromStruct(&struct {
        TenantID string `json:"tenant_id" jsonschema:"required"`
    }{}),
    StrictTypes: []string{"params.tenant_id"},
}
```

Định dạng: `"<namespace>.<field>"` trong đó namespace là `body`, `query`, hoặc `params`.

---

## Ghi đè schema thô

Thay vì `MustFromStruct`, cung cấp một JSON Schema viết tay để kiểm soát hoàn toàn:

```go
var cfg = validation.Config{
    BodySchema: []byte(`{
        "type": "object",
        "required": ["role"],
        "properties": {
            "role": {"type": "string", "enum": ["admin", "viewer"]}
        }
    }`),
}
```

Có thể trộn: dùng `MustConfig[T]` cho phần lớn namespace và ghi đè từng schema riêng khi cần.

---

## gRPC interceptor

Áp validate schema cho handler gRPC unary và streaming.

```go
import "github.com/bangdinh/go-kit/middleware/validation"

var grpcCfg = validation.GRPCConfig{
    Schema: validation.MustFromStruct(&mypb.CreateUserRequest{}),
}

// Unary
grpc.NewServer(
    grpc.UnaryInterceptor(validation.NewGRPCInterceptor(grpcCfg)),
)

// Streaming
grpc.NewServer(
    grpc.StreamInterceptor(validation.NewGRPCStreamInterceptor(grpcCfg)),
)
```

Interceptor marshal message protobuf sang JSON, validate theo schema, và trả về `codes.InvalidArgument` khi thất bại. Nếu `cfg.Schema` là nil, bỏ qua validate hoàn toàn.

---

## Hành vi quan trọng

- **Compile schema được cache** — schema compile một lần ở lần dùng đầu (key theo sha256) và tái dùng cho mọi request sau. Không tốn chi phí compile mỗi request.
- **`additionalProperties: false` được ép mặc định** — `Reflector` của `invopop/jsonschema` phát ra `"additionalProperties": false` cho mọi schema sinh từ struct. Field thừa trong body **bị từ chối** khi dùng `MustConfig[T]` hoặc `MustFromStruct`. Ai cần schema nới lỏng phải cung cấp schema thô bỏ `"additionalProperties": false`, hoặc chỉ đưa vào các field muốn validate.
- **Validate theo từng namespace là độc lập** — body, query và params mỗi cái chạy theo schema riêng. Schema nil bỏ qua namespace đó hoàn toàn.
- **Ép kiểu query và path param** — giá trị string được parse sang integer, number, hoặc boolean khi schema khai báo các type đó. Dùng `StrictTypes` để giữ field cụ thể ở dạng string.
