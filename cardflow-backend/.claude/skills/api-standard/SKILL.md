---
name: api-standard
description: Use when designing, implementing, or reviewing REST API endpoints in VMSmart NEXT microservices — URI naming, HTTP methods/status, response envelope, error format, pagination, service-to-service auth, versioning. Trigger khi "thiết kế API", "tạo endpoint", "review API", "API convention", "error response", "internal API", "pagination".
---

# VMSmart NEXT REST API Convention

Source: VMSN-STD-API-001 v1.0 (Quy chuẩn phát triển REST API). Three levels:
**CORE** = mandatory quality gate (PR review + DoD) · **CONDITIONAL** = only when a trigger applies · **PREFERENCE** = VMSmart NEXT project default.

Principles: consumer-first (business language, not DB/controller structure), consistent, stateless (no sticky session/local state as source of truth), secure by default, backward compatible, minimal observability (traceId, timeout, structured log).

## URI & Naming (CORE)

Two mutually exclusive shapes, decided by segment 2. Lowercase throughout, no trailing `/`.

```
A.  /{service}/public/{anything}                                    ← authn only, no permission check
B.  /{service}/v{major}/{urn…}[/type/{rtype}[/id/{rid}]]/actions/{scope}[/{suffix}…]
```

| Item | Rule |
|---|---|
| `{service}` | First segment, the Kong Gateway Service name — same as the deployment/app name (`device-management`). Takes no part in the permission decision. |
| `v{major}` | `v1`, `v2` — **only** at segment 2. A `v2` further down the path is an ordinary urn segment. |
| `{urn}` | 1..N segments, kebab-case. Must match a `Feature.urn` registered in BRM's catalog. Kong joins with `:` and maps `-`→`_`. |
| `/type/{rtype}` `/id/{rid}` | Resource being checked. `{rtype}` is snake_case verbatim from a **closed list** — today only `device` and `group_place`. `/id/` must sit *immediately* after `/type/{value}`, nothing between. |
| `/actions/{scope}` | **Always required** on branch B, GET included. |
| `/{suffix}` | Anything after `/actions/{scope}/` — Kong ignores it, use it freely. |
| JSON fields | camelCase: `displayName`, `createdAt` |
| Path params | Meaningful: `{deviceId}`, never generic `{id}` |

```
GET  /device-management/v1/device/monitor/actions/view/summary        ✅
GET  /device-management/v1/device/type/device/id/dev_456/actions/view  ✅
GET  /api/v1/devices                                                   ❌ no {service}, no /actions/
GET  /device-management/v1/device/dev_456                              ❌ no /actions/{scope}
```

Resources are business representations — never return ORM entities or internal/secret fields directly.

### Which mode — the choice you actually make

`/type/` and `/id/` are not decoration; together they pick what Kong asks BRM.

| On the URL | Mode | Permission checked against |
|---|---|---|
| neither `/type/` nor `/id/` | enterprise-wide | no specific resource (create, global action, `feature:*`, `auth:sso`, `audit`, `noti`) |
| both `/type/` and `/id/` | one resource | that id, taken from the path |
| `/type/` but no `/id/` | bulk | every id in the body's `resource_ids` |

`{rtype}` comes from a **closed list** (`device`, `group_place`). Need another → talk to BRM
first; inventing one merges green and 403s at runtime. Business name ≠ technical name: a
camera is `/type/device`, **never** `/type/camera`. Which urns take one: `device:*` and
`media:*` → `type/device`; `org:structure:group_place*` → `type/group_place`; the rest are
enterprise-wide and carry neither.

**Tenant is never on the path.** BRM derives it from the JWT realm, so no `enterprises/{id}`
segment. It comes back as the `X-Tenant-Id` header.

**Query string never affects the permission decision.** An id in `?deviceId=` is unchecked —
put it in `/id/{rid}` or in `resource_ids`.

An unregistered `{urn}` is not a merge-time error: it surfaces as `403 FEATURE_DENIED` on the
first real request, which reads exactly like the caller merely lacking the permission.

**Gateway (Kong)**: **one catch-all route per service**, `strip_path=false` — the full path including
`{service}` reaches the service unchanged, so mount routes with that prefix (`e.Group("/device-management/v1/…")`).
Kong picks the upstream by `{service}` and derives the permission from the URL itself; adding an endpoint
touches no Kong config. A URL off-convention is **not** a 404 — the catch-all matches and the plugin
returns `500 ROUTE_MISCONFIGURED` at request time, so it ships green and fails in the environment.
`/healthz` `/readyz` `/metrics` stay at root and are not published through Kong.

Branch A (`public` at segment 2, no version) is for endpoints with no permission to check. It is an
explicit, deliberate choice — not a shortcut around declaring one. Writing `/{service}/v1/public/…` does
**not** match it: that falls through to branch B and 500s for want of `/actions/`.

Full rules, reserved words and the checklist: `kong-plugin/docs/kong-convention.md`.
What the service receives in return: `docs/gateway-contract.md`.

### Bulk — khi một request đụng nhiều resource

URL có `/type/{rtype}` nhưng **không** có `/id/{rid}`. Kong đọc id ra khỏi body
và hỏi BRM về **tất cả** trước khi forward — tất-cả-hoặc-không.

```go
type MoveRequest struct {
    Body struct {
        gateway.BulkRequest                       // resource_ids []string
        TargetGroupID string `json:"targetGroupId"`
    }
}
```

| Luật | |
|---|---|
| `POST` luôn | kể cả khi bản chất là đọc — cần body để mang id |
| field tên `resource_ids` | **snake_case** — ngoại lệ DUY NHẤT của luật camelCase ở trên |
| ≤ `gateway.MaxResourceIDs` (200) | vượt → `413 TOO_MANY_RESOURCES`, chia lô, đừng nâng trần |
| 1 `resource_type` / request | Kong chỉ hỏi BRM về một loại |
| **mọi** id cần kiểm quyền phải nằm trong đó | để sót một cái ngoài danh sách là lỗ hổng, không phải thiếu sót |

Đừng đổi `resource_ids` thành `resourceIds` cho "đúng chuẩn": plugin tra đúng
key cố định đó (`convention.lua:106`), đổi là `400 RESOURCE_IDS_REQUIRED` ở
gateway — đọc như client quên field, trong khi thật ra là ta gõ sai. Dùng
`gateway.BulkRequest` thay vì tự khai, đã có test chặn.

Bulk là cách **duy nhất** để kiểm quyền trên hơn một resource trong cùng một
request — kể cả khi chỉ có đúng hai và nghiệp vụ không hề "hàng loạt". Ví dụ
chuyển thiết bị giữa hai nhóm: cả nhóm nguồn lẫn nhóm đích đều cần quyền, mà
`/id/{rid}` trên path chỉ chứa được một.


## HTTP Methods (CORE)

| Method | Use | Typical status |
|---|---|---|
| GET | Read only, no state change | 200, 304 |
| POST | Create or command | 201 (+`Location`), 202, 200 |
| PUT | Full replace | 200, 204 |
| PATCH | Partial update with published schema | 200, 204 |
| DELETE | Delete / start deletion | 204, 202 |

Method does **not** decide `{scope}`: method is HTTP semantics, scope is the permission — two independent axes. `GET …/actions/view` and `DELETE …/actions/delete` are both right; dropping `/actions/` because "GET obviously reads" is the mistake.

401/403 usually never reach the service: `brm-authz` answers first with `{error, source: "brm-authz", details}` — **not** RFC 9457. The `source` field is the tell.

## Success Response (CORE, VMSmart REQUIRED)

`Content-Type: application/json`. Light envelope — `data` is the main field. **No** `result`, `success`, `codeStatus`, `message` (HTTP status already says the outcome). Request bodies must carry a proper `Content-Type`; server validates type/required/length/range/format.

| Field | Level | Rule |
|---|---|---|
| `data` | REQUIRED | Object/array/null per operation schema; stable type per operation |
| `page` | CONDITIONAL | Paginated collections: `limit`, `nextCursor`, `hasMore`; `total` only if cheap |
| `meta`, `links` | OPTIONAL | Response metadata / navigation (`self`, `next`) when genuinely useful |

```json
{"data": [{"id": "res_123", "displayName": "Example"}],
 "page": {"limit": 50, "nextCursor": "eyJpZCI6...", "hasMore": true}}
```

- 204 → no body (never `{"data": null}`); 201 → `Location` header, optionally new representation in `data`.
- Empty collection → 200 with `data: []`, never 404.
- Async task → 202 with job resource: `{"data": {"id": "job_123", "status": "pending", "statusUrl": "/order-service/v1/job/actions/view/job_123"}}`.

## Error Response (CORE)

Never HTTP 200 for errors. `Content-Type: application/problem+json` (RFC 9457). Success and error envelopes never mix (no `data` in errors, no `code`/`message` in success).

| Field | Level | Meaning |
|---|---|---|
| `type`, `title`, `status` | REQUIRED | `about:blank` today (no error portal exists — don't invent a URI); short stable title; status must match the status line |
| `code` | REQUIRED | Stable app error code, UPPER_SNAKE_CASE — clients branch on this |
| `traceId` | REQUIRED | Log/trace lookup, no sensitive data |
| `detail`, `instance` | OPTIONAL | Human-readable / occurrence URI; never for client branching |
| `errors` | CONDITIONAL | Per-field list for multi-validation errors |

```json
{"type": "about:blank",
 "title": "Validation failed", "status": 422, "code": "VALIDATION_FAILED",
 "traceId": "01J5B9D8Y8ZX...",
 "errors": [{"field": "displayName", "code": "NOT_BLANK", "reason": "must not be blank"}]}
```

Status map: 400 syntax/param · 401 unauthenticated · 403 no permission · 404 not found (or hidden) · 409 conflict/duplicate · 422 business validation failed · 429 rate limited · 5xx server/upstream.

## Implementation in go-kit — reuse existing helpers `CORE`

Do NOT hand-roll the handler flow, response wrappers, error mapping, validation, or pagination —
core already provides them. Use the exact names below (naming compliance + no re-creation).

### Standard endpoint → `server/httpx` (the enforced flow — preferred)

`httpx` bakes in the full sequence so no step is skipped: bind → validate (JSON Schema) → map
Request→Command → call service → render the `data` envelope (2xx) or a ProblemDetail (error).
Compile each schema once with `validation.MustConfig[T]()`, then wire routes:

```go
var createCfg = validation.MustConfig[CreateOrderRequest]()
var getCfg    = validation.MustConfig[GetOrderRequest]()

// {service}=order-service, {urn}=order — mount the {service} prefix, strip_path=false
g := e.Group("/order-service/v1/order", gatewayMW)

g.POST("/actions/create", httpx.HandleCreated(createCfg,
    func(r *CreateOrderRequest) CreateOrderInput { return CreateOrderInput{Name: r.Body.Name} }, // map Req->Command
    h.svc.Create,                                                                                  // service action
    func(d OrderResponse) string { return "/order-service/v1/order/actions/view/" + d.ID },        // Location
))
g.GET("/actions/view/:orderId", httpx.Handle(getCfg,
    func(r *GetOrderRequest) string { return r.Params.ID },
    h.svc.GetByID,
))
```

- `httpx.Handle` → 200 `{"data":{...}}` · `HandleCreated` → 201 + `Location` · `HandleList` → 200
  `{"data":[...],"page":{...}}` · `HandleNoContent` → 204.
- Path param stays meaningful (`:orderId`, never `:id`), and sits **after** `/actions/{scope}` — everything past the scope is free suffix Kong ignores.
- `cmd/scaffold` generates exactly this shape and a test guards it: `cmd/scaffold/templates/internal/__resource__/handler.go.tmpl`.
- Custom endpoints (upload / stream / webhook) write an explicit `echo.HandlerFunc` — don't force httpx.

The layers `httpx` builds on — use these directly in custom handlers or inside services:

### Responses — `go-kit/response`
- Single: `response.NewData(dto)` → `{"data": {...}}`.
- Collection: `response.NewPage(items, response.PageMeta{Limit, NextCursor, HasMore, Total})`.
- From a repo result: `cursorResult.ToPage()` / `paginatedResult.ToPage()` → `response.Page`.
- `201`: set `Location` (convention shape: `/{service}/v1/{urn}/actions/view/{id}`) + `c.JSON(201, response.NewData(dto))`. `204`: `c.NoContent(http.StatusNoContent)`.

### Errors — `go-kit/errors` (handler just `return err`)
- Build with a constructor, NOT `errors.New(CodeX, ...)`:
  `NotFound` · `Unauthorized` · `Forbidden` · `InvalidInput`(400) · `ValidationFailed`(422) ·
  `AlreadyExists`/`Conflict`(409) · `PreconditionFailed` · `OutOfRange` · `RateLimited` · `Timeout` ·
  `ServiceUnavailable` · `Unimplemented` · `InternalError` / `InternalErrorWrap(msg, cause)`.
- Wrap a cause: `errors.Wrap(code, msg, cause)`. Inspect: `errors.Is(err, errors.CodeNotFound)`.
- The central Echo `jsonErrorHandler` renders any returned `*AppError` into the ProblemDetail —
  never call `ToProblemDetail`/`ValidationProblem*` from a handler.

### Validation — `go-kit/middleware/validation`
- Config from a struct (schema from `jsonschema:` tags): `cfg := validation.MustConfig[CreateOrderReq]()`.
- In a handler (bind + validate + 422 on fail): `req, err := validation.BindAndValidate[CreateOrderReq](c, cfg)`.
- Or as middleware: `g.Use(validation.New(cfg))`. Per-field codes (e.g. `MIN_LENGTH`) come free.

### Pagination — `go-kit/domain`
- Sanitize input: `limit := domain.ClampLimit(req.Limit, domain.MaxLimit)` (defaults `DefaultLimit`=20 / `MaxLimit`=100);
  `field, order := domain.ParseSort(req.Sort)`.
- Result → response: build `domain.CursorResult[T]` or `domain.NewPaginatedResult(items, total, page, size)`, then `.ToPage()`.

### Entity mixins — `go-kit/domain` (embed, don't rewrite)
`domain.Timestamps` (+`NewTimestamps()`/`Touch()`) · `domain.Version` (optimistic lock, `Increment()`) ·
`domain.SoftDelete` · `domain.AuditInfo` (`NewAuditInfo(actor)`).

### Routing & middleware (mount on the echo group)
- `e.Group("/{service}/v1/{urn}", gatewayMW)`; path param `:orderId` after `/actions/{scope}`.
- Behind Kong: `gateway.New(cfg.Gateway)` — **fail-closed**, `New()` returns an error when no
  token is configured. Identity: `gateway.UserID(c)` / `gateway.TenantID(c)`.
- Do **NOT** mount `auth.New` or `PDPChecker` on business routes behind Kong — `Authorization`
  is stripped, so you would verify a token that isn't there and 401 every request. Kong already
  decided the permission. `VerifyTenantIDInToken` must be **off**: the claim is a UUID while
  `X-Tenant-Id` is a `company_code`, so the comparison can never match.
- `auth.New` + `NewPDPChecker` still apply off the Kong path: `/internal/v1` and a service's own
  ingress. Internal-only: `/internal/v1/...` + `serviceauth.New(cfg)` (azp allowlist).
- Idempotency (POST/PATCH): `idempotency.New(cfg)` — scope comes from the gateway identity.
  Rate limit: `ratelimit.New(cfg)` (sets `Retry-After`).
- `/healthz` `/readyz` `/metrics` never get `gatewayMW` — probes would die for want of the token.

### Server / health / metrics
- HTTP server + central error handler: `echomod.Module` (fx). Health: `observability.NewHealthHandler()`,
  register deps `health.Register(name, checker, observability.WithCritical())` → `/healthz` `/readyz`.
  Metrics on `:10254`: `observability.MetricsServerModule`.

### Contract
Keep `api/openapi.yaml` (OAS 3.1) in the same PR. Rationale: `docs/adr/0001-response-contract.md` (why only).

## Data Types (CORE)

IDs are opaque strings · time ISO 8601 UTC (`2026-08-19T07:30:00Z`) · real JSON types (no `"true"`, `"123"`) · enums declared in OpenAPI · distinguish missing vs null vs empty string · money = amount + currency, no float.
Whitelist writable fields (no mass-assignment). Never return password/token/credential/internal address/stack trace.

## Query & Pagination (CORE)

```
GET /device-management/v1/device/actions/view?status=active&sort=-createdAt&limit=50&cursor=...
```
Filter/sort via whitelisted fields/operators only — never pass input into SQL/DSL. Every collection has `defaultLimit`, `maxLimit`, stable default order. Offset OK for small/stable lists; cursor for large/changing datasets (see triggers).

## Security Baseline (CORE)

Every non-public endpoint authenticates (signature/issuer/audience/expiry). Authorization checks operation **and** resource (unguessable ID ≠ permission check). Deny by default, least privilege; client never sets owner/tenant/security fields. Validate input, limit request size, TLS in production. No token/credential/PII in URLs, logs, examples.

## Internal Service API (service-to-service)

- Surfaces: `/{service}/v1/…/actions/{scope}` through Kong (user + service principals), `/internal/v1/...` service-only ops (orchestration, reconciliation, privileged commands, bulk/sync), `/healthz` `/readyz` `/metrics` operational.
- `/internal/v1` is the **only** surface that skips Kong, so it is the only one without the `{service}` prefix and without `/actions/{scope}` — nothing reads its URL to derive a permission.
- Don't duplicate a Kong-fronted endpoint under `/internal` just because the caller is a service — if contract+authz can be shared safely, keep the one endpoint.
- `/internal` is contract classification, **not** a security boundary: still requires service identity + network policy + authorization. Never publish via public ingress/Kong public route (ClusterIP/service DNS/internal route only).
- Auth: Keycloak OAuth 2.0 **Client Credentials** — each microservice has its own identity (no shared credentials); target validates signature, issuer, expiry, **audience**, and caller `client_id`/`azp`; deny-by-default caller allowlist per operation. Secrets from secret management only. mTLS/mesh = CONDITIONAL.
- Tenant: service token identifies the caller service, not a user/tenant. Prefer deriving tenant from resource/job created in a trusted flow; if `tenantId` passed via header/payload, accept only after service auth and still check caller's tenant permission; public ingress strips internal headers. Preserve user permissions via token exchange/on-behalf-of, never forward user tokens to another audience.
- Every internal call: `traceparent` propagated, explicit timeout; retry only idempotent ops or with `Idempotency-Key` (backoff + max attempts). Internal contract in `openapi-internal.yaml` (kept off public portal); same method/status/error/versioning rules as CORE.

## OpenAPI & Compatibility (CORE)

OpenAPI (OAS 3.1.x) is source of truth, lives with source code, changes in the same PR as implementation. Each operation: stable `operationId`, params/body, success+error responses, security, example. Breaking = remove/rename field, change type/semantics/method, optional→required. Non-breaking = add endpoint/optional field (consumers must ignore unknown fields). Major version in path; bump only when compatibility can't be kept additively.

## Conditional Triggers

| Trigger | Apply |
|---|---|
| Retryable POST with side effects | `Idempotency-Key` + stored result per key |
| Multiple writers on one resource | ETag/`If-Match` or optimistic locking |
| Large/fast-changing dataset | Cursor pagination with stable sort |
| Task exceeds timeout / needs progress/cancel | 202 + job resource |
| Hot repeated reads, stable data | `Cache-Control`/ETag with security-aware cache key |
| Public/partner API or abuse risk | Rate limit/quota, 429 + `Retry-After` |
| Sensitive operation / audit requirement | Dedicated immutable audit log |
| Critical API / notable load | Load baseline + dashboard/alert |
| Cascading dependency failure | Retry budget, circuit breaker/bulkhead |
| High-risk partner / compliance | mTLS / private-key JWT |

## VMSmart NEXT Preferences (key REQUIRED ones)

REST is Control Plane only (RTSP/ONVIF/WHIP/WHEP = Media Plane). Auth: Keycloak/OIDC — web/mobile Authorization Code + PKCE, services Client Credentials. **Behind Kong there is no token left**: the `brm-authz` plugin strips `Authorization` and hands the service `X-Gateway-Token` / `X-User-Id` / `X-Tenant-Id`, so tenant context comes from those headers via `middleware/gateway` — never from a client payload, and never from a JWT the service verifies itself. Kong owns TLS, routing **and the permission decision**; services keep business rules and resource-level checks Kong cannot make (see `kong-convention.md` §5 on why an id taken from the URL is still client-supplied). Cursor pagination for AI events/alert/audit streams. Domain owners (Device, Site, IAM, Alert, Recording/Media Orchestration) — services never touch each other's DB.

## PR Checklist (Definition of Done)

- [ ] URI follows the Kong convention: `/{service}/v{major}/{urn}/…/actions/{scope}` (or the `public` branch); urn kebab-case, JSON camelCase
- [ ] `{urn}` registered as a `Feature.urn` with BRM; no segment collides with a reserved word (`public` `v{n}` `type` `id` `actions`)
- [ ] `/id/` only ever right after `/type/`; an action touching ≥2 resources uses bulk with **every** id to check inside `resource_ids`
- [ ] Business routes mount `gatewayMW`, not `auth.New`/PDP; method/status/error follow CORE; no errors wrapped in 200
- [ ] OpenAPI + examples updated in same PR; breaking changes identified
- [ ] AuthN, resource authorization, input validation tested (incl. wrong audience/caller for internal)
- [ ] DTO leaks no entity/secret; types/time/null/enum clear; collection has limit
- [ ] Success uses `data` envelope; errors use `application/problem+json`
- [ ] Service-only routes under `/internal/v1`, not published through Kong or public ingress
- [ ] No sticky-session/local-state dependence; timeouts + structured log + traceId present
- [ ] Conditional triggers checked: retry/duplicate, multi-writer, large dataset, long-running, public/partner, critical load
