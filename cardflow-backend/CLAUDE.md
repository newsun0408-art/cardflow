# CLAUDE.md

Guidance for Claude Code in the **cardflow-backend** service. **Keep this file lean** — it loads
into every prompt. The detail lives in the files pointed to below; here, only what
prevents wrong guesses and loops.

## What this is

`cardflow-backend` — an FLI-Platform Go microservice built on `go-kit` (Clean Architecture,
Uber fx). Module `github.com/bangdinh/cardflow-backend`. Serves HTTP on `:8080`, `GET /healthz`, Prometheus metrics
on `:10254`.

## Mindset — reuse core, don't fabricate  (READ FIRST)

- **Reuse `go-kit` (core) first.** Before writing anything, check whether core already
  provides it — a module (config, postgres/mysql/mongo, redis, kafka/mqtt, minio, http/grpc
  client, observability), a middleware (auth/rbac/validation/idempotency/rate-limit/audit),
  a helper (`response`, `errors`, `domain`, `util`), a server adapter (`httpx`). Use it — do
  NOT re-implement what core already has.
- **Don't fabricate.** Never invent an API, config key, type, or pattern from memory. If unsure
  core has X, verify against the source (`go doc github.com/bangdinh/go-kit/<pkg>`, the
  module's README). Source is the authority — don't guess.
- **Shared gap → propose it to CORE, don't write per-service.** If a capability is common
  (useful across services) but missing in core, do NOT hand-roll it here — propose adding it to
  `go-kit` so every service shares one impl. Only truly service-specific logic lives in this repo.
- **Surface trade-offs.** When a decision has a real trade-off, state it + give a recommendation;
  never silently pick.
- **Don't improvise structure; ASK.** If a request doesn't fit the `feature-flow`, ask first.

## Cấu trúc là ĐÓNG — đặt file đúng chỗ (bản đồ đầy đủ: `docs/architecture.md`)

```
internal/<resource>/   1 feature = 1 package, tách theo FILE:
                       entity · dto · repository · service · store · cache · handler(HTTP)
                       · grpc · ws · consumer(Kafka/MQTT) · producer · cron · saga
internal/shared/       type THUẦN DOMAIN ≥2 feature dùng (không echo/grpc/pgxpool/go-redis)
internal/middleware/   middleware/interceptor RIÊNG service (core đã có auth/rbac/idempotency/…)
internal/client/<đích>/ gọi service khác / third-party — dựng trên core client/{http,grpc,resilience}
```

- Feature B cần dữ liệu feature A → **port khai ở B**, nhận DTO (không nhận Entity, không share `entity.go`).
- **KHÔNG tạo**: `internal/common|utils|helpers|pkg/` · `internal/models|dto|repository|services|handlers/`
  (tách theo tầng = phá feature-first) · `internal/transport|api/` · `pkg/` ở gốc.
- Chưa chốt (**HỎI**, đừng tự đặt): layout `.proto` · key config riêng service.

## Verify — exact commands (one shot, not per-package)

```bash
go build ./...      # compile the whole service
go test ./...       # run all tests
```

- Chain edit → build → test with `&&`.
- `go-kit` is a **private** module — set once: `go env -w GOPRIVATE=github.com/bangdinh`. (Local `go.work` dev: see `docs`/versioning.)
- Cập nhật go-kit theo tag (thư viện + asset dùng chung): `make sync-gokit VERSION=vX.Y.Z` — chi tiết `CONTRIBUTING.md` §8b.

## Conventions

Full rules: HTTP/API → skill **`api-standard`**; cấu trúc + coding (requestId/DB/cache/crypto/TDD) → skill **`feature-flow`**.
**#1 trap (inline):** handler just `return err` (typed) → framework renders ProblemDetail — never build one, add `codeStatus`/`success`, or pick a status. Success = `response.NewData`/`NewPage`; secrets stay out of git.

## Where to look (don't re-explain these)

- **`docs/architecture.md`** — vì sao feature-first, vai trò layer, luật clean-arch, data flow, fx wiring (tham chiếu sâu).
  (Cấu trúc + thứ tự gen + coding-rule → skill `feature-flow`; response contract → skill `api-standard`; git → `CONTRIBUTING.md` + skill `git-flow`.)
- **`api/openapi.yaml`** — the HTTP contract (source of truth; update it in the same PR as the code).
- **Skills** (`.claude/skills/`, auto-applied): **feature-flow** (adding a feature/endpoint —
  file structure, layer roles, generation order, naming) · **api-standard** (endpoint
  design/behavior: URI, response, errors, pagination) · **git-flow** (branches / commits / MR).

## Adding code — follow the flow

Adding a feature/resource or a new endpoint? Follow the **`feature-flow`** skill
(`.claude/skills/feature-flow/`) — exact files, roles, order, and naming. Don't improvise the
structure; if a request doesn't fit, **ASK**. Architecture detail: `docs/architecture.md`.
