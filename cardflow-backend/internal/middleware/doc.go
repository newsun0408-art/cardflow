// Package middleware — middleware/interceptor RIÊNG của service cardflow-backend (chạm transport).
//
// Soi chiếu core `go-kit/middleware/*` nhưng ở cấp service: chỉ những gì service này cần
// mà service khác không. Rỗng lúc mới sinh là ĐÚNG.
//
// TRƯỚC KHI viết — core đã có, dùng luôn, KHÔNG viết lại:
//
//	auth            JWT verify (Keycloak/OIDC)        rbac            role/permission, PDP checker
//	serviceauth     service principal (azp allowlist) idempotency     Idempotency-Key cho POST/PATCH
//	ratelimit       giới hạn tần suất                 circuitbreaker  chặn cascade khi downstream lỗi
//	audit           audit log                         header          metadata/identity từ header
//	validation      bind + validate theo jsonschema
//
// ĐƯỢC ở đây (ví dụ):
//
//	clubcontext.go  resolve X-Club-ID -> ctx (chỉ service này có khái niệm club)
//	legacyauth.go   chấp nhận token cũ của một client cụ thể trong giai đoạn migrate
//
// Cùng package cho cả HTTP và gRPC: `echo.MiddlewareFunc` và `grpc.UnaryServerInterceptor`
// đặt cạnh nhau, tách theo FILE.
//
// KHÔNG ở đây: business rule (thuộc service.go của feature) · truy vấn DB (middleware chỉ
// đọc/ghi ctx; cần dữ liệu thì nhận port hẹp do feature owner cung cấp) · middleware mà
// MỌI service đều cần (→ đề xuất đưa lên core `middleware/`).
//
// Mount: truyền vào RegisterRoutes của feature — `h.RegisterRoutes(e, mw.ClubContext(...))`
// — hoặc `e.Use(...)` trong cmd/server/main.go nếu áp cho toàn service.
//
// Type thuần domain (không chạm echo/grpc) → `internal/shared/`.
// Chi tiết: docs/architecture.md · skill .claude/skills/feature-flow.
package middleware
