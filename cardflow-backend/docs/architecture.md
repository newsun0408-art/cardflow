# Kiến trúc — tham chiếu

Giải thích **vì sao** & tham chiếu sâu cho service Go trên `go-kit`.
Thao tác "gen file gì, thứ tự nào, đặt tên ra sao" → skill **`feature-flow`** (`.claude/skills/feature-flow/`).
Hành vi endpoint (URI/response/error/pagination) → skill **`api-standard`**.

---

## Feature-First (Vertical Slice)

Mỗi feature = **1 Go package** chứa đủ layer của nó. Clean Architecture vẫn giữ qua interface (port)
và hướng phụ thuộc đúng.

- **Bounded context = microservice** — mỗi service ít feature, không sợ "quá nhiều folder".
- **High cohesion** — code của 1 feature nằm chung 1 package → dễ đọc, dễ navigate.
- **Same-package access** — Entity/Store/Cache cùng package → không cần Row type, không cần Entity↔Row mapping.
- **Interface vẫn là port** — `Repository` khai trong package feature → ranh giới clean-arch còn nguyên.

---

## Cây thư mục

```
your-service/
├── cmd/
│   ├── server/main.go      Entrypoint HTTP/gRPC (config → logger → tracer → fx wire → run)
│   ├── migrate/main.go     golang-migrate runner (up/down)
│   ├── worker/main.go      Background job / queue consumer
│   └── cli/main.go         Administrative CLI
├── application-config/
│   └── config.json         Runtime config (postgres, redis, keys, addr…)
├── api/
│   └── openapi.yaml        OpenAPI 3.1 — source of truth hợp đồng HTTP
├── migrations/             SQL migration files
└── internal/
    ├── <resource>/         ONE FEATURE = ONE PACKAGE
    │   ├── doc.go          Package doc — bản đồ tầng + rule hướng phụ thuộc
    │   ├── entity.go       Domain struct thuần, nhúng domain.Timestamps
    │   ├── dto.go          Request Model + Command/Input + DTO
    │   ├── repository.go   Port interface
    │   ├── service.go      Business logic (nhận Command, tạo Entity, map Entity→DTO)
    │   ├── handler.go      HTTP adapter (Echo) qua server/httpx
    │   ├── store.go        Repository impl (PostgreSQL + cache check)
    │   └── cache.go        Redis cache (read-through, mức Entity)
    ├── shared/             Type cross-cutting RIÊNG service — THUẦN DOMAIN (không echo/grpc/pgx)
    │   └── doc.go          Ranh giới của shared/ (đọc trước khi thêm file)
    ├── middleware/         Middleware/interceptor RIÊNG service (soi chiếu core middleware/*)
    │   └── doc.go
    └── client/             Client OUTBOUND riêng service — mỗi đích 1 sub-package
        └── doc.go
```

- **`cmd/`** — điểm khởi chạy; `main.go` chỉ bootstrap (config/logger/DI), không business logic.
- **`application-config/`** — config tĩnh, hỗ trợ GitOps/K8s ConfigMap.
- **`internal/`** — mã nghiệp vụ riêng; Go compiler chặn project khác import.

---

## Bản đồ quyết định — cần gì thì sinh file nào

Tra bảng trước khi tạo file. Cấu trúc là **đóng**: không thêm thư mục/tầng nào ngoài bảng này.

### Trong một feature — package `internal/<resource>/`

| Cần | File | Dựa trên core |
|---|---|---|
| Domain struct của resource | `entity.go` | `domain.Timestamps`, `Version`, `SoftDelete`, `AuditInfo` |
| Request / Command / DTO | `dto.go` | tag `jsonschema` cho `BindAndValidate` |
| Port persistence | `repository.go` | `domain.Repository[T, ID]` nếu khớp |
| Business logic | `service.go` | `errors.*` (typed AppError) |
| Endpoint HTTP | `handler.go` | `server/httpx.Handle*` |
| Method gRPC | `grpc.go` | `server/grpcx.Handle` |
| Stream WebSocket | `ws.go` | `server/wsx.Handle` |
| Consume Kafka/MQTT của feature | `consumer.go` | `messaging/kafka` (`MessageHandler`), `messaging/mqtt`, dedup `messaging/inbox` |
| Publish event | `producer.go` + ghi outbox trong `store.go` **cùng transaction** | `messaging/kafka`, `messaging/outbox.Insert(ctx, tx, msg)` |
| SQL / persistence | `store.go` | `pgxpool`, `errors.*` |
| Cache | `cache.go` | `go-redis`, read-through |
| Job định kỳ của feature | `cron.go` | `util/cron` |
| Điều phối multi-step có bù trừ | `saga.go` | `domain/saga` |
| Test | `<file>_test.go` cạnh file được test | TDD: đỏ trước |

Một feature = một package, tách theo **file**, KHÔNG tách sub-folder theo tầng.

### Cross-feature, trong service này

| Cần | Đặt ở | Điều kiện |
|---|---|---|
| Type thuần domain dùng chung | `internal/shared/<type>.go` | ≥2 feature dùng thật; không import `echo`/`grpc`/`pgxpool`/`go-redis` |
| Middleware / interceptor | `internal/middleware/<mối-quan-tâm>.go` | riêng service này; core chưa có (soát `middleware/*` trước) |
| Gọi service khác / third-party | `internal/client/<đích>/client.go` | dựng trên `client/http`·`client/grpc`·`client/resilience`; feature dùng qua **port** |
| Feature B cần dữ liệu feature A | Port khai ở **B**, wire fx ở `cmd/server/main.go` | truyền DTO, không truyền Entity |

### Ngoài `internal/`

| Cần | Đặt ở | Ghi chú |
|---|---|---|
| Đổi schema DB | `migrations/{VVVVVV}_<verb>_<resource>.{up,down}.sql` | 6 số **tuần tự toàn service**; KHÔNG sửa migration đã merge |
| Hợp đồng HTTP | `api/openapi.yaml` | nguồn chân lý hình dạng API (skill `api-standard`) |
| Wiring DI | `cmd/server/main.go` | cache→store→service→handler; `mountRoutes` nhận thêm handler |
| Process mới (worker/cli/migrate) | `cmd/<tên>/main.go` **+** `deploy/entrypoints/docker-entrypoint-<tên>.sh` **+** build trong `deploy/Dockerfile` | thiếu 1 trong 3 = vỡ deploy contract của platform |
| Config runtime | `application-config/config.json` (+ `example.config.json`) | đọc qua `config.Config` của core |
| Quyết định khó đảo | `docs/adr/NNNN-<title>.md` | ADR, không chôn trong code review |

### CHƯA CHỐT — phải HỎI, không tự đặt

| Việc | Vì sao chưa chốt |
|---|---|
| Layout file `.proto` cho hợp đồng gRPC | Repo chưa có convention nào cho `.proto` / code generate; đặt bừa sẽ khác nhau giữa các service |
| Key config **riêng** của service | `config.Config` của core là struct đóng (`app`, `api`, `postgres`, `redis`, `kafka`, `auth`, `http_clients`, `grpc_clients`…). Key lạ trong `config.json` bị bỏ qua khi unmarshal — chưa có chỗ hợp lệ cho config riêng service |

### KHÔNG BAO GIỜ tạo (dù thấy "gọn hơn")

`internal/models/` · `internal/dto/` · `internal/repository/` · `internal/services/` · `internal/handlers/`
(tách theo **tầng** = phá feature-first) · `internal/common/` · `internal/utils/` · `internal/helpers/` ·
`internal/pkg/` (tên vô nghĩa, thành thùng rác — dùng `shared/` với điều kiện của nó) ·
`internal/transport/`, `internal/api/` (adapter thuộc package feature) · `pkg/` ở gốc (mã nghiệp vụ nằm trong `internal/`).

---

## Vai trò từng file

| File | Vai trò | Imports |
|---|---|---|
| `doc.go` | Package doc: bản đồ tầng + quy tắc hướng phụ thuộc. Chỉ 1 file giữ package doc. | — |
| `entity.go` | Data struct thuần. Nhúng `domain.Timestamps`. Không tag protocol, không logic. | `go-kit/domain` |
| `dto.go` | **Request Model** (`Body`/`Query`/`Params` + tag `jsonschema`, cho `BindAndValidate`) + **Command/Input** (không tag, hợp đồng vào Service) + **DTO** (Entity → output an toàn). | — (cùng package) |
| `repository.go` | Port interface `Repository` — domain cần gì ở persistence. | — (cùng package) |
| `service.go` | Business logic. Nhận **Command**, tạo Entity (UUID v7), validate nghiệp vụ, gọi `Repository`, map Entity→DTO. Không biết HTTP. | `domain`, `uuid`, `go-kit/errors` |
| `handler.go` | HTTP adapter. `RegisterRoutes(e *echo.Echo, mw ...echo.MiddlewareFunc)` — mw áp cho group của feature (chỗ bọc auth/rbac; echo v4 không có interface chung cho `*echo.Echo` và `*echo.Group` nên KHÔNG truyền group vào đây). Qua `server/httpx` (`Handle`/`HandleCreated`/`HandleList`/`HandleNoContent`): adapter tự `BindAndValidate` → map Request→Command → gọi Service → render envelope/ProblemDetail. Chỉ khai `cfg` + mapper + service method; KHÔNG `c.Bind`/`c.JSON`, KHÔNG chạm Entity. | `server/httpx`, `middleware/validation`, `echo` |
| `store.go` | Impl `Repository`. Raw SQL + cache check. Trả Entity, hoặc typed `apperrors` (NotFound khi no rows, InternalErrorWrap khi lỗi DB). | `pgxpool`, `zap`, `go-kit/errors` |
| `cache.go` | Redis cache. Get/Set Entity. Lỗi → log warn + trả miss, không surface lên trên. | `go-redis`, `zap` |
| `grpc.go` | Inbound adapter gRPC. `grpcx.Handle` (cùng flow bind→validate→Command→Service→render như HTTP). Map lỗi qua `errors.*`; KHÔNG tự set gRPC status. | `server/grpcx`, `google.golang.org/grpc` |
| `ws.go` | Inbound adapter WebSocket. `wsx.Handle`. Mỗi message = 1 use case; không giữ business state trong connection. | `server/wsx` |
| `consumer.go` | Inbound adapter message. `kafka.MessageHandler`/MQTT → map payload → Command → gọi Service. Idempotent: dedup bằng `messaging/inbox`; lỗi → trả err để retry/dead-letter, KHÔNG nuốt. | `messaging/kafka`, `messaging/inbox` |
| `producer.go` | Outbound adapter message. Publish event của feature. Cần đảm bảo cùng transaction với ghi DB → `outbox.Insert(ctx, tx, msg)` trong `store.go`, relay tự phát sau. | `messaging/kafka`, `messaging/outbox` |
| `cron.go` | Job định kỳ của feature: đăng ký lịch + gọi Service. Không chứa business rule; job phải idempotent (chạy trùng không hỏng). | `util/cron` |
| `saga.go` | Điều phối multi-step có bù trừ (compensation) khi một bước fail. Chỉ orchestration, bước thực thi vẫn ở Service. | `domain/saga` |
| `response` (core) | `Data[T]` (single) / `Page[T]` (collection) — một format envelope cho mọi service. Lỗi: `go-kit/errors` ProblemDetail. | — |

---

## Nhiều feature dùng chung một thứ

"Dùng chung" có 4 dạng, chỉ **một** dạng thuộc `internal/shared/`. Vạch đúng dạng trước khi viết code:

| Tình huống | Giải pháp | Vì sao |
|---|---|---|
| Entity thuộc **1 feature**, feature khác chỉ cần **đọc** | Consumer khai **port hẹp**, owner cắm vào qua fx | Một bảng có đúng một owner; consumer không chạm SQL/Store của owner |
| Type **không thuộc feature nào**, ≥2 feature dùng thật (`Money`, `Address`, `TenantID`, enum chung) | `internal/shared/` | Đúng định nghĩa cross-cutting của service |
| 2 feature **cùng một bảng / cùng aggregate** | **Gộp thành 1 feature** (thêm endpoint) | Ranh giới feature vạch sai — không phải vấn đề share code |
| Helper generic không mang nghiệp vụ (crypto) | `internal/shared/crypto.go`, gọi **chỉ từ store.go** | Không để logic mã hoá leo lên handler/service |
| Type **mọi service** đều cần | Đưa lên core `go-kit` (`domain/`, `util/`) | Như `domain.Timestamps`, `response.Data[T]` — không copy-paste từng service |

### Pattern port — feature B cần dữ liệu của feature A

KHÔNG share `entity.go`, KHÔNG copy struct. B khai interface theo **nhu cầu của B**, A thoả mãn nó:

```go
// internal/invoice/service.go — port đặt ở CONSUMER, nhận DTO chứ không nhận Entity
type OrderReader interface {
	GetByID(ctx context.Context, id string) (order.Response, error)
}

type Service struct {
	repo   Repository
	orders OrderReader
}
```

```go
// cmd/server/main.go — fx nối, *order.Service đã thoả OrderReader
app.WithProviders(
	order.NewService, order.NewHandler,
	func(s *order.Service) invoice.OrderReader { return s },
	invoice.NewService, invoice.NewHandler,
)
```

- Truyền **DTO/`Response`**, không truyền **Entity**: Entity là nội bộ của owner, đổi cột DB không được làm vỡ feature khác.
- Interface đặt ở **consumer**, không ở owner → test B chỉ cần fake vài dòng, không cần Postgres, và B không phụ thuộc ngược vào chi tiết của A.
- Consumer **không** import `Repository`/`Store` của owner, **không** viết SQL vào bảng của owner. Đây là luật "một bảng một owner" hạ xuống cấp feature (cùng tinh thần service không đụng DB của service khác).

### Luật cho `internal/shared/`

Vào được khi thoả **cả 3**: (a) không feature nào owner nó · (b) **≥2 feature dùng thật ngay lúc này** ·
(c) thuần domain — không I/O, không transport, không SQL.

| Loại được share | File ví dụ | Nội dung |
|---|---|---|
| Value object | `money.go`, `address.go`, `phone.go`, `daterange.go` | `Money{Amount int64; Currency string}` + `Add/Sub/Compare`; immutable, constructor validate |
| Enum / status dùng chung | `channel.go`, `severity.go` | `type Channel string` + `Parse()`/`String()`/`Valid()` |
| Định danh nghiệp vụ | `tenant.go` | `TenantID` + parse/validate — chỉ **kiểu ID**, không phải entity của bảng |
| Rule/policy thuần | `pricing.go`, `vat.go` | Hàm thuần: làm tròn tiền, tính VAT, format mã hoá đơn. Vào/ra là value, không `ctx`, không DB |
| Crypto field-level | `crypto.go` | Mã hoá field trước khi ghi DB — gọi **chỉ từ `store.go`** |
| Normalizer / formatter | `phoneformat.go`, `slug.go` | Chuẩn hoá SĐT, slugify — khi ≥2 feature cần cùng một cách chuẩn hoá |
| Sentinel / error code nghiệp vụ | `errors.go` | Chỉ khi ≥2 feature cùng raise; vẫn build bằng `apperrors.*` của core, shared giữ mã dùng chung |

Naming: 1 file cho 1 nhóm type, tên **số ít**, không prefix service. Chỉ tách sub-package
(`internal/shared/money/`) khi nhóm đó đủ lớn và có test riêng đáng kể.

**KHÔNG bao giờ**: `Repository`/`Store`/SQL (persistence thuộc feature owner) · `echo`/`pgxpool`/`go-redis`/HTTP
client (outbound dùng `client/` của core, wire trong feature cần) · DTO/Request có tag `jsonschema` (thuộc
`dto.go` của feature) · Entity **có bảng DB** (có bảng ⇒ là feature) · fx `Module`/provider, config struct,
logger (bootstrap ở `cmd/`, config đọc từ `config.Config` của core).

### Code dùng chung có CHẠM transport (HTTP/gRPC) — không vào `shared/`

`shared/` là domain thuần nên không nhận `echo`/`grpc`/`pgxpool`. Ba chỗ còn lại, theo phạm vi dùng:

| Phạm vi | Đặt ở | Ví dụ |
|---|---|---|
| Adapter của **1 feature** | Chính package feature: `handler.go` (HTTP) · `grpc.go` · `ws.go` | endpoint `/{service}/v1/order/actions/create`, gRPC `OrderService` |
| Cross-feature, **chỉ service này** — middleware/interceptor | `internal/middleware/` | `clubcontext.go` resolve `X-Club-ID` → ctx |
| Cross-feature, **chỉ service này** — gọi ra ngoài | `internal/client/<đích>/` | `deviceb2b/client.go`, `vnpay/client.go` |
| **Mọi service** đều cần | Đề xuất lên core `middleware/`, `client/`, `server/*` | JWT verify, idempotency, gRPC pool |

Cả HTTP và gRPC dùng **cùng** package `internal/middleware`, tách theo file: `echo.MiddlewareFunc` và
`grpc.UnaryServerInterceptor` đặt cạnh nhau — cùng một mối quan tâm, hai transport.

**`internal/client/` dựng trên core, không tự viết transport**: `client/http` (client + registry + metrics),
`client/grpc` (conn pool + interceptor), `client/resilience` (retry/timeout/circuit breaker/bulkhead). Sub-package
chỉ làm 3 việc: khai method theo nghiệp vụ · map payload đích ↔ type service này · map lỗi HTTP/gRPC → `apperrors.*`.

Feature **không** import trực tiếp sub-package client — vẫn qua **port khai ở feature**, y như pattern port ở trên:

```go
// internal/order/service.go
type DeviceReader interface {
	GetDevice(ctx context.Context, id string) (DeviceInfo, error)
}
// cmd/server/main.go
func(c *deviceb2b.Client) order.DeviceReader { return c },
```

Nhờ vậy đổi Device từ HTTP sang gRPC chỉ sửa `internal/client/deviceb2b/`, feature không đụng tới.

Middleware **không** truy vấn DB: nó chỉ đọc/ghi `context.Context`; cần dữ liệu thì nhận port hẹp do feature
owner cung cấp. Mount qua `h.RegisterRoutes(e, mw.ClubContext(...))`, hoặc `e.Use(...)` nếu áp toàn service.

### Trông giống shared nhưng thuộc core `go-kit` — ĐỪNG viết lại

Trước khi thêm file vào `shared/`, soát bảng này: viết lại thứ core đã có là **defect**.

| Định làm | Core đã có |
|---|---|
| `createdAt`/`updatedAt`, version, soft delete, audit | `domain.Timestamps` · `domain.Version` · `domain.SoftDelete` · `domain.AuditInfo` |
| Kiểu phân trang / cursor | `domain.Cursor` · `domain.Offset` · `domain.Page` · `domain.CursorResult[T]` |
| Interface repository generic | `domain.Repository[T, ID]` · `ReadRepository` · `WriteRepository` |
| Domain event | `domain.DomainEvent` · `BaseEvent` · `EventRecorder` |
| requestId, retry, ETag, singleflight, worker pool, pipeline, cron, eventbus, `SafeGo` | `util/*` (`util.SetETag`/`CheckIfMatch`, `util/retry`, `util/singleflight`, …) |
| Envelope thành công / lỗi | `response.Data[T]` · `response.Page[T]` · `errors.*` (RFC 9457) |
| Validate request theo schema | `middleware/validation` + `server/httpx` |

Cùng một thứ mà **mọi service** đều cần → đề xuất đưa lên core, không để trong `shared/` của từng service.

Ba dấu hiệu phải dừng lại và vạch lại ranh giới feature: `shared/` chứa struct có bảng DB · `shared/` import `echo`/`pgxpool` · mọi feature phải sửa `shared/` cho *mỗi* thay đổi (nó đã thành god package).

Ngưỡng vào `shared/`: **≥2 feature dùng thật**. Một feature dùng → để trong feature đó. "Để dành cho sau" → chưa vào.

---

## Luật Clean Architecture

| Luật | Cách enforce |
|---|---|
| Handler KHÔNG tạo Entity | Service nhận Command, tự tạo Entity |
| Handler dùng `server/httpx`, không tự bind/render | Adapter lo BindAndValidate + envelope + `return err` |
| Request Model (HTTP) ≠ Command (domain) | Handler map Request→Command; Service chỉ thấy Command |
| Validate FORMAT ở cổng, NGHIỆP VỤ ở Service | JSON Schema (BindAndValidate) vs `apperrors` trong Service |
| Handler KHÔNG import Entity | Handler & Entity cùng package, nhưng Handler chỉ dùng DTO |
| Entity→DTO là việc của Service | `Service.GetByID()` trả DTO, không trả Entity |
| Repository là interface (port) | Khai trong package feature, Store impl |
| Store impl Repository | Cùng package → không cần Row↔Entity mapping |
| Cache lỗi thì im lặng | Log warn, trả miss — không propagate |

---

## Import alias (chốt — tránh đụng tên giữa core và service)

| Import | Alias |
|---|---|
| core `middleware/auth`, `middleware/rbac` | `authware`, `rbacware` (giữ hậu tố `ware`) |
| `internal/middleware` của service | `mw` |
| `internal/client/<đích>` | tên package của đích (`deviceb2b`) — không alias |
| core `client/grpc` (package tên `grpc`) đứng cạnh `google.golang.org/grpc` | alias core thành `gkgrpc` |
| core `errors` · stdlib `errors` · `net/http` · `go-redis` | `apperrors` · `stderrors` · `nethttp` · `goredis` |

## Naming (chuẩn — tránh stutter, KHÔNG prefix resource)

Package name đã cho ngữ cảnh → type phụ **không lặp tên resource**. Đọc `product.Store`, KHÔNG `product.ProductStore`.

| Concept | Type | Ví dụ (resource = `product`) |
|---|---|---|
| Entity | `<Resource>` | `product.Product` |
| Repository interface | `Repository` | `product.Repository` |
| Service | `Service` | `product.Service` |
| Handler | `Handler` | `product.Handler` |
| Store (repo impl) | `Store` | `product.Store` |
| Cache | `Cache` | `product.Cache` |
| Request Model | `Create<Op>Request` | `product.CreateRequest` |
| Command / Input | `Create<Op>Input` | `product.CreateInput` |
| DTO (response) | `Response` | `product.Response` |
| Success envelope | core `response.Data[T]` / `Page[T]` | `response.NewData(product.Response{})` |

**Ngoại lệ:** entity giữ tên resource (`product.Product`) như stdlib `list.List`/`ring.Ring` — type chính của package.

---

## Data Flow

```
HTTP Request
    ↓ handler.go     server/httpx: BindAndValidate → map Request→Command → call service
    ↓ service.go     nhận Command, tạo Entity (UUID v7), validate, call repo → map Entity→DTO
    ↓ repository.go  port interface
    ↓ store.go       impl Repository: check cache → query DB → populate cache
    ↓ cache.go       Redis Get/Set (read-through, mức Entity)
```

**Read (GetByID):** handler gọi `svc.GetByID` → service gọi `repo.GetByID` (nhận Entity) → map Entity→DTO;
store check cache trước, miss thì query DB rồi populate cache.

**Write (Create):** handler `HandleCreated`: bind+validate → map Request→Command → `svc.Create`;
service tạo Entity (UUID v7 + `domain.NewTimestamps()`) → `repo.Create` → store INSERT.

---

## fx Wiring

```go
app.WithProviders(
    // infra — client providers từ go-kit modules
    func(h postgres.PostgresHandler) *pgxpool.Pool { return h.Pool() },
    func(h redis.RedisHandler) goredis.UniversalClient { return h.Client() },

    // <resource> feature — cache → store → service → handler
    func(client goredis.UniversalClient) *productfeat.Cache { return productfeat.NewCache(client, logger) },
    func(pool *pgxpool.Pool, cache *productfeat.Cache) productfeat.Repository { return productfeat.NewStore(pool, logger, cache) },
    productfeat.NewService,
    productfeat.NewHandler,
)
```

Một import mỗi feature: `productfeat "mymodule/internal/product"`.

---

## Skills — ranh giới (mỗi skill 1 phạm vi, không chéo)

| Skill | Sở hữu | Trả lời |
|-------|--------|---------|
| `feature-flow` | cấu trúc file 1 feature · vai trò layer · thứ tự gen · naming · coding rule per-layer | "Tạo file gì, ở đâu, thứ tự nào?" |
| `api-standard` | hành vi endpoint: URI · status · response envelope · error · pagination · auth · openapi | "Endpoint cư xử ra sao?" |
| `git-flow` | branch · commit · MR · Jira · hotfix · tag | "Làm git thế nào?" |
