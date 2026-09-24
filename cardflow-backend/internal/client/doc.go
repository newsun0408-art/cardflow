// Package client — client OUTBOUND riêng của service cardflow-backend: gọi service khác hoặc
// third-party (chạm transport). Mỗi đích một sub-package.
//
//	internal/client/
//	  doc.go              luật (file này)
//	  deviceb2b/client.go  gọi service Device qua HTTP/gRPC
//	  vnpay/client.go      gọi cổng thanh toán
//
// DỰNG TRÊN CORE, không tự viết transport:
//
//	client/http        HTTP client + transport, registry theo tên, metrics
//	client/grpc        gRPC conn pool, registry, interceptor, metrics
//	client/resilience  retry / timeout / circuit breaker / bulkhead
//
// Việc của sub-package ở đây chỉ là: (1) khai method theo nghiệp vụ (`GetDevice(ctx, id)`),
// (2) map payload của đích ↔ type của service này, (3) map lỗi HTTP/gRPC → `apperrors.*`.
// Config (base URL, timeout, cred) đọc từ `config.Config`, wire bằng fx trong cmd/server.
//
// Feature dùng client qua PORT do chính feature khai (dependency inversion) — feature KHÔNG
// import trực tiếp sub-package client:
//
//	// internal/order/service.go
//	type DeviceReader interface {
//		GetDevice(ctx context.Context, id string) (DeviceInfo, error)
//	}
//	// cmd/server/main.go: func(c *deviceb2b.Client) order.DeviceReader { return c }
//
// KHÔNG ở đây: business rule (thuộc service.go của feature) · truy cập DB của service khác
// (chỉ gọi qua API — không service nào đụng DB của service khác) · client mà MỌI service đều
// cần (→ đề xuất đưa lên core `client/`).
//
// Type thuần domain (không chạm HTTP/gRPC) → `internal/shared/`.
// Chi tiết: docs/architecture.md · skill .claude/skills/feature-flow.
package client
