# cardflow-backend

Được scaffold từ [go-kit](https://github.com/bangdinh/go-kit) theo kiến trúc **feature-first**.

## Bắt đầu nhanh

```bash
go env -w GOPRIVATE=github.com/bangdinh   # go-kit là private module — chạy 1 lần
go mod tidy
make run                          # chạy HTTP server local (:8080)
```

Mọi lệnh khác (test/build/migrate/release/cập nhật gokit…): gõ **`make`** hoặc **`make help`** —
danh sách + mô tả từng lệnh nằm ngay trong [Makefile](./Makefile) (nguồn chân lý, khỏi tra doc).

## Kiến trúc

Kiến trúc sâu (vì sao, vai trò layer, data flow, fx): [docs/architecture.md](./docs/architecture.md).
Thao tác thêm feature/endpoint (thứ tự gen file, naming, coding-rule): skill `.claude/skills/feature-flow/`.

**Feature-first** — mỗi feature là một package Go dưới `internal/`, chứa toàn bộ các layer của nó:

```
internal/<resource>/
├── entity.go       Domain struct thuần (nhúng domain.Timestamps của go-kit)
├── dto.go          Request Model (bind HTTP) + DTO (Entity → output cho client)
├── repository.go   Port interface (khai báo trong package feature)
├── service.go      Business logic, tạo Entity, map Entity → DTO
├── handler.go      HTTP adapter (Echo): trả DTO (2xx), lỗi thì return err
├── store.go        Cài đặt Repository (PostgreSQL)
└── cache.go        Redis cache (read-through, mức Entity)
```

Success envelope là **dùng chung ở core** — `github.com/bangdinh/go-kit/response` (`response.Data[T]` single, `response.Page[T]` collection): một format cho mọi service. Lỗi dùng `errors.ProblemDetail` (cũng ở core). Code dùng chung **riêng service** có 3 chỗ, tuỳ nó chạm gì: `internal/shared/` (type thuần domain, không `echo`/`grpc`/`pgxpool`) · `internal/middleware/` (middleware/interceptor) · `internal/client/<đích>/` (gọi service khác/third-party). Mỗi thư mục có `doc.go` nêu luật; bản đồ đầy đủ ở [docs/architecture.md](docs/architecture.md).

## Resource đầu tiên: `sample`

Scaffold đã sinh sẵn stub cho resource `sample`. Muốn thêm resource mới, copy thư mục `internal/sample/` rồi đổi tên:

1. Copy `internal/sample/` → `internal/<resource-của-bạn>/`
2. Đổi tên `package` trong mọi file
3. Thay các type tên `Sample` bằng tên PascalCase của resource mới
4. Wire feature mới trong `cmd/server/main.go`

## Module

```
github.com/bangdinh/cardflow-backend
```

## Lệnh

Xem đầy đủ (mô tả + tham số) bằng **`make help`** — định nghĩa ở [Makefile](./Makefile):

`make run` · `make test` · `make lint` · `make build` · `make migrate-up` / `make migrate-down` ·
`make release VERSION=vX.Y.Z` · `make sync-gokit VERSION=vX.Y.Z`.

## Contract Response API — RFC 9457

Dùng **HTTP status thật**, không bọc lỗi vào envelope 200.

- **Thành công**: envelope nhẹ `data` — single: `response.NewData(dto)` => `{"data": {...}}`; collection: `response.NewPage(items, meta)` => `{"data": [...], "page": {limit, nextCursor, hasMore}}`; 201 kèm `Location` header; 204 không body.
- **Lỗi**: handler chỉ `return err` (một `*apperrors.AppError` do service/store tạo). Error handler
  trung tâm của core (`server/echo`) map Code -> status và render RFC 9457 ProblemDetail:

```json
{ "type":"...", "title":"Resource not found", "status":404, "code":"NOT_FOUND", "traceId":"..." }
```

Code (`go-kit/errors`): `NotFound` 404 · `InvalidInput` 400 · `ValidationFailed` 422 · `Conflict` 409 · `InternalError` 500.
