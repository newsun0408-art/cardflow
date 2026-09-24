---
name: feature-flow
description: >-
  Áp dụng khi THÊM code vào service go-kit — tạo feature/resource mới hoặc endpoint mới.
  Định nghĩa cấu trúc file một feature (entity/dto/repository/service/handler/store/cache),
  vai trò từng layer, THỨ TỰ generate file, naming, và coding-rule per-layer (requestId, DB log,
  cache, crypto, TDD). Trigger khi: 'thêm feature', 'tạo resource', 'thêm endpoint/API',
  'tạo file cho ...', 'add feature/endpoint', 'gen service code', 'nhiều feature dùng chung',
  'share entity/type giữa feature', 'internal/shared', 'thêm middleware', 'interceptor',
  'gọi service khác', 'gọi third-party', 'internal/client', 'thêm consumer Kafka/MQTT',
  'publish event/outbox', 'thêm cron job', 'thêm method gRPC', 'WebSocket', 'đặt file ở đâu'. Đầu vào là planning/Jira +
  api/openapi.yaml → suy ra file cần gen. Mục tiêu: gen ĐÚNG FLOW từ plan/doc, KHÔNG tự chế cấu
  trúc, KHÔNG bịa nghiệp vụ. Giải thích sâu (why + bảng/data-flow/fx): docs/architecture.md.
---

# feature-flow — từ planning/doc → gen file đúng flow

Nguồn thao tác chính khi thêm code. Generate đúng file + vai trò + thứ tự dưới đây. KHÔNG tự đặt
cấu trúc khác, KHÔNG bỏ/gộp file, KHÔNG đoán. Không khớp flow → **HỎI**.
Giải thích "vì sao" + bảng vai trò/luật clean-arch/data-flow/fx đầy đủ: **`docs/architecture.md`**.

## 0. Từ planning/doc → xác định gen gì  (LÀM TRƯỚC KHI TẠO FILE)

Chỉ gen dựa trên các nguồn sau — KHÔNG bịa resource/field/verb ngoài đây:

- **Planning / Jira ticket** — nghiệp vụ: cần resource nào, thao tác (verb) nào, rule gì.
- **`api/openapi.yaml`** — hợp đồng HTTP (path · method · schema): nguồn chân lý hình dạng API.
- **`docs/architecture.md`** — layout & vai trò layer (đích đến của mỗi file).

Rồi chốt 3 điều TRƯỚC khi tạo file:

1. **Loại việc**: resource CHƯA có → mục *Thêm FEATURE*; resource ĐÃ có → mục *Thêm ENDPOINT*.
2. **Liệt kê**: tên `<Resource>` + danh sách endpoint (`verb path`) + field chính — viết ra trước.
3. **Thiếu/không rõ** trong plan/openapi/doc (tên resource, field, verb, rule) → **HỎI**, không đoán.

## 0b. BẢN ĐỒ SINH FILE — tra bảng, KHÔNG tự đặt chỗ mới

Cấu trúc là **ĐÓNG**. Mỗi nhu cầu có đúng một chỗ. Không khớp bảng nào → **HỎI**, không suy diễn.

Trong feature (`internal/<resource>/`, tách theo FILE, không sub-folder theo tầng):

| Nhu cầu | File | Core dùng |
|---|---|---|
| domain struct | `entity.go` | `domain.Timestamps`/`Version`/`SoftDelete`/`AuditInfo` |
| Request·Command·DTO | `dto.go` | tag `jsonschema` |
| port persistence | `repository.go` | `domain.Repository[T, ID]` nếu khớp |
| business logic | `service.go` | `errors.*` |
| endpoint HTTP | `handler.go` | `server/httpx.Handle*` |
| method gRPC | `grpc.go` | `server/grpcx.Handle` |
| stream WebSocket | `ws.go` | `server/wsx.Handle` |
| consume Kafka/MQTT | `consumer.go` | `messaging/kafka`·`mqtt`, dedup `messaging/inbox` |
| publish event | `producer.go` + outbox ghi trong `store.go` **cùng tx** | `messaging/outbox.Insert(ctx, tx, msg)` |
| SQL | `store.go` | `pgxpool`, `errors.*` |
| cache | `cache.go` | `go-redis` read-through |
| job định kỳ | `cron.go` | `util/cron` |
| multi-step có bù trừ | `saga.go` | `domain/saga` |

Ngoài feature: xem bảng "Dùng chung giữa nhiều feature" bên dưới (`internal/shared` · `internal/middleware` ·
`internal/client/<đích>`) và: schema → `migrations/{VVVVVV}_...` · hợp đồng HTTP → `api/openapi.yaml` ·
wiring → `cmd/server/main.go` · process mới → `cmd/<tên>/main.go` **+** `deploy/entrypoints/docker-entrypoint-<tên>.sh`
**+** build trong `deploy/Dockerfile` (thiếu 1 trong 3 = vỡ deploy contract) · quyết định khó đảo → `docs/adr/`.

**CHƯA CHỐT — HỎI trước, KHÔNG tự đặt**: layout file `.proto` cho gRPC · key config riêng của service
(`config.Config` của core là struct đóng, key lạ bị bỏ khi unmarshal).

**KHÔNG BAO GIỜ tạo** (viết đủ đường dẫn để không nhận nhầm):

- Tách theo tầng = phá feature-first: `internal/models/` · `internal/dto/` · `internal/repository/` ·
  `internal/services/` · `internal/handlers/`
- Tên vô nghĩa → thành thùng rác: `internal/common/` · `internal/utils/` · `internal/helpers/` · `internal/pkg/`
- Adapter thuộc package feature, không tách ra: `internal/transport/` · `internal/api/`
- Mã nghiệp vụ luôn trong `internal/`: `pkg/` ở gốc

Thấy "gọn hơn" cũng KHÔNG — cấu trúc giống nhau giữa mọi service là yêu cầu, không phải sở thích.

## Thêm FEATURE (resource) mới → 1 package `internal/<resource>/` (copy feature có sẵn rồi đổi tên)

1. `entity.go`     — domain struct `<Resource>` (nhúng `domain.Timestamps`); không tag HTTP, không logic
2. `dto.go`        — `CreateRequest` (bọc Body/Query/Params + tag `jsonschema`) · Command `CreateInput` (không tag) · DTO `Response`
3. `repository.go` — interface `Repository` (port)
4. `service.go`    — `Service`: nhận **Command** → tạo Entity (UUID v7) → business rule → map Entity→DTO
5. `store.go`      — `Store` impl `Repository` (Postgres + cache); trả Entity / typed `apperrors`
6. `cache.go`      — `Cache` (Redis read-through; lỗi = log + miss)
7. `handler.go`    — `Handler.RegisterRoutes` qua `httpx.Handle*` (cfg + mapper Request→Command + service method)

Rồi: **8.** `migrations/00000N_create_<resource>_table.{up,down}.sql` · **9.** `api/openapi.yaml` (thêm path + schema — quy tắc contract: skill `api-standard`) · **10.** wire fx trong `cmd/server/main.go` (cache→store→service→handler) · **11.** `_test.go` cho từng file (TDD: viết test đỏ trước).

## Thêm ENDPOINT vào feature có sẵn — chỉ chạm file của feature đó

`dto.go` (Request + Command [+DTO]) → `repository.go` (thêm method nếu cần) → `store.go` (impl) →
`service.go` (method nghiệp vụ) → `handler.go` (route qua `httpx`) → `api/openapi.yaml` (operation) →
`migrations/` (chỉ khi đổi schema; KHÔNG sửa migration đã merge) → test.

## Dùng chung giữa nhiều feature — chọn ĐÚNG 1 dòng trong bảng, không tự chế dòng mới

Trước khi viết dòng code nào cho phần "dùng chung", trả lời 2 câu: **(a)** thứ này có bảng DB không?
**(b)** feature nào là owner? Rồi tra bảng:

| Nếu… | Thì | KHÔNG được |
|---|---|---|
| Owner là 1 feature, feature khác chỉ **đọc** | Consumer khai **port hẹp** (dưới đây), owner cắm qua fx | share `entity.go`, copy struct, import `Repository`/`Store` của owner, viết SQL vào bảng owner |
| Không feature nào owner, **≥2 feature dùng thật** | `internal/shared/<type>.go` (đọc `internal/shared/doc.go` trước) | nhét vào đây thứ có bảng DB |
| 2 feature **cùng bảng / cùng aggregate** | **GỘP** thành 1 feature → mục *Thêm ENDPOINT* | tạo feature thứ 2 trên cùng bảng |
| Util mã hoá | `internal/shared/crypto.go`, gọi **chỉ từ `store.go`** | gọi từ handler/service |
| Adapter (HTTP/gRPC/WS) của **1 feature** | Chính package feature: `handler.go` · `grpc.go` · `ws.go` | tạo package transport riêng |
| Middleware/interceptor **riêng service** | `internal/middleware/` (chung cho cả echo + grpc, tách theo file) | nhét vào `shared/`; truy vấn DB trong middleware |
| Gọi service khác / third-party | `internal/client/<đích>/`, dựng trên `client/http`·`client/grpc`·`client/resilience` | tự viết transport; feature import trực tiếp sub-package (phải qua port) |
| **Mọi service** đều cần | Đề xuất đưa lên core `go-kit` (`domain/`, `util/`) — HỎI trước | copy-paste vào từng service |

Chỉ 1 feature dùng → để trong feature đó. "Để dành cho sau" → **chưa** vào `shared/`.

### Pattern port (dạng hay gặp nhất — feature B cần dữ liệu của feature A)

Interface đặt ở **B (consumer)**, không ở A. B nhận **DTO `Response`**, KHÔNG nhận **Entity** của A.

```go
// internal/invoice/service.go
type OrderReader interface {
	GetByID(ctx context.Context, id string) (order.Response, error)
}

type Service struct {
	repo   Repository
	orders OrderReader
}
```

```go
// cmd/server/main.go — fx nối; *order.Service đã thoả OrderReader
func(s *order.Service) invoice.OrderReader { return s },
```

Lý do (đừng "tối ưu" bỏ port): Entity là nội bộ owner — đổi cột DB không được làm vỡ feature khác; port ở
consumer thì test B fake vài dòng, không cần Postgres.

### Khi được phép thêm file vào `internal/shared/`

Điều kiện vào — phải thoả **cả 3**, thiếu 1 thì để type đó trong feature đang dùng:
(a) không feature nào owner · (b) **≥2 feature dùng thật NGAY LÚC NÀY** · (c) thuần domain (không I/O).

| Được share | File | Nội dung |
|---|---|---|
| Value object | `money.go` `address.go` `phone.go` `daterange.go` | struct immutable + method thuần, constructor validate |
| Enum/status dùng chung | `channel.go` `severity.go` | `type X string` + `Parse()`/`String()`/`Valid()` |
| Định danh nghiệp vụ | `tenant.go` | chỉ **kiểu ID** + validate, KHÔNG phải entity của bảng |
| Rule/policy thuần | `vat.go` `pricing.go` | hàm thuần value→value, không `ctx`, không DB |
| Crypto field-level | `crypto.go` | gọi **chỉ từ `store.go`** |
| Normalizer/formatter | `phoneformat.go` `slug.go` | một cách chuẩn hoá dùng chung |
| Error code nghiệp vụ | `errors.go` | chỉ khi ≥2 feature cùng raise; build bằng `apperrors.*` |

KHÔNG: `Repository`/`Store`/SQL · `echo`/`pgxpool`/`go-redis`/HTTP client · DTO/tag `jsonschema` ·
Entity có bảng DB · fx `Module`/provider · config struct · logger.
1 file = 1 nhóm type, tên **số ít**, không prefix service.

**Test 1 câu**: `shared/` KHÔNG import `echo`, `grpc`, `pgxpool`, `go-redis`. Cần import chúng ⇒ code đó
thuộc `internal/middleware/`, `internal/client/<đích>/`, hoặc package feature — KHÔNG phải `shared/`.
Đọc `doc.go` của thư mục đích trước khi thêm file (mỗi thư mục có luật riêng ngay trong package doc).

### TRƯỚC KHI tạo file trong `shared/` — soát bảng này (viết lại thứ core đã có = defect)

| Định làm | Core `go-kit` đã có → dùng luôn |
|---|---|
| `createdAt`/`updatedAt`, version, soft delete, audit | `domain.Timestamps` `domain.Version` `domain.SoftDelete` `domain.AuditInfo` |
| Phân trang / cursor | `domain.Cursor` `domain.Offset` `domain.Page` `domain.CursorResult[T]` |
| Repository generic | `domain.Repository[T, ID]` `ReadRepository` `WriteRepository` |
| Domain event | `domain.DomainEvent` `BaseEvent` `EventRecorder` |
| requestId · retry · ETag · singleflight · worker pool · pipeline · cron · eventbus · `SafeGo` | `util/*` |
| Envelope success / error | `response.Data[T]` `response.Page[T]` · `errors.*` (RFC 9457) |
| Validate request theo schema | `middleware/validation` + `server/httpx` |

Thứ **mọi service** đều cần → KHÔNG tự thêm vào `shared/`: đề xuất đưa lên core và **HỎI** trước.

Gặp 1 trong 3 dấu hiệu này → **DỪNG, báo lại ranh giới feature sai**, không code tiếp: `shared/` có struct
mang bảng DB · `shared/` import `echo`/`pgxpool` · mọi feature phải sửa `shared/` cho mỗi thay đổi.

## Naming (bắt buộc — tránh stutter, KHÔNG prefix resource)

Package name đã cho ngữ cảnh → đọc `product.Store`, KHÔNG `product.ProductStore`. Khớp đúng code scaffold sinh ra.

**Import alias (chốt — tránh đụng tên giữa core và service):** core middleware giữ hậu tố `ware`
(`authware`, `rbacware`) · `internal/middleware` → `mw` · `internal/client/<đích>` dùng luôn tên package
của đích (`deviceb2b`), không alias · core `client/grpc` (package tên `grpc`) đứng cạnh
`google.golang.org/grpc` thì alias core thành `gkgrpc` · giữ nguyên alias core: `apperrors`, `stderrors`,
`nethttp`, `goredis`.

- **File** (số ít, cố định): `entity.go` `dto.go` `repository.go` `service.go` `handler.go` `store.go` `cache.go` — 1 feature = 1 package.
- **Type**: Entity `<Resource>` (vd `Product`) · `Repository` · `Service` · `Handler` · `Store` · `Cache` · `CreateRequest` · `CreateInput` · `Response`.
- **Migration**: cặp `{VVVVVV}_<verb>_<resource>[...].{up,down}.sql`. VERSION = **6 số tuần tự toàn service = (max hiện có)+1** (`000001`,`000002`…, KHÔNG dùng timestamp). 1 thay đổi = 1 cặp up/down. **KHÔNG sửa migration đã merge** (đổi schema tiếp = cặp số cao hơn). Đụng số do làm song song (hiếm) → người merge SAU bump lên số trống kế tiếp. Chi tiết: `migrations/README.md`.

## Coding rule per-layer (bắt buộc khi viết mỗi file)

- **requestId** — KHÔNG là tham số method. Middleware lấy từ header `X-Request-ID` (thiếu → UUID v7) rồi bỏ vào `context.Context`; mọi signature chỉ nhận `ctx`. Log lấy requestId từ ctx. **Không `fmt.Sprintf`** cho log — mỗi biến 1 `zap.Field`.
- **DB log** (`store.go`) — log **trước khi** chạy query: SQL ở `debug`, params ở `info` (params phải thấy trên prod); `request_id` là `zap.String` mỗi dòng. Không log trong callback.
- **Cache** (`cache.go`) — read-through: miss/lỗi → fallback Postgres, **không** surface lỗi cache; write-back sau khi fetch DB, TTL mặc định 5'; lỗi cache log `warn` rồi trả miss. Cache thao tác trực tiếp Entity (cùng package).
- **Crypto** — util mã hoá đặt ở `internal/shared/crypto.go`; gọi **chỉ từ Store**, không từ Handler/Service.
- **TDD** — bắt buộc mọi feature/bugfix: red (viết test đỏ trước, chạy cho FAIL) → green (code tối thiểu cho PASS) → chạy full suite → refactor. Viết impl trước khi có test đỏ = vi phạm.

## Không bao giờ

- Đặt middleware/client (chạm `echo`/`grpc`) vào `internal/shared/`; feature import trực tiếp sub-package
  `internal/client/<đích>/` thay vì qua port; middleware truy vấn DB.
- Share `entity.go` giữa 2 feature; đặt `Repository`/`Store`/SQL vào `internal/shared/`; tạo feature thứ 2
  trên cùng một bảng (→ gộp thành 1 feature).
- Tự chế cấu trúc/đặt tên khác flow; thêm prefix resource vào type phụ (`ProductStore` ✗); bỏ/gộp file; handler tự `c.Bind`/`c.JSON` (dùng `httpx`); service đụng SQL/`echo`.
- Hành vi API (URI/response/error/pagination) → skill **`api-standard`**. Git (branch/commit/MR) → skill **`git-flow`**. Vì sao/kiến trúc sâu → **`docs/architecture.md`**.
