// Package shared — type cross-cutting RIÊNG của service cardflow-backend.
//
// Chỗ duy nhất cho type mà KHÔNG feature nào sở hữu nhưng ≥2 feature dùng thật:
// value object (Money, Address, TenantID), enum/status dùng chung, Actor, util mã hoá.
// Rỗng lúc mới sinh service là ĐÚNG — chỉ thêm khi có nhu cầu thật, không "để dành".
//
// ĐƯỢC ở đây:
//
//	money.go      type Money + rule cộng/trừ/so sánh (thuần domain)
//	tenant.go     TenantID + parse/validate
//	crypto.go     mã hoá field — gọi CHỈ từ store.go của feature, không từ handler/service
//
// KHÔNG ở đây — kèm chỗ phải đặt thay thế:
//
//	Repository / Store / SQL   → feature owner của bảng (store.go)
//	middleware / interceptor   → internal/middleware/   (chạm echo/grpc)
//	client gọi service khác    → internal/client/<đích>/ (chạm HTTP/gRPC)
//	adapter của 1 feature      → chính package feature đó (handler.go · grpc.go · ws.go)
//	tag jsonschema / DTO       → dto.go của feature (hợp đồng HTTP)
//	Entity có bảng DB          → nếu có bảng thì nó là FEATURE, không phải shared
//
// Luật một câu: shared/ KHÔNG import echo, grpc, pgxpool, go-redis. Cần import chúng nghĩa
// là code đó thuộc internal/middleware/, internal/client/, hoặc package feature.
//
// Feature A cần dữ liệu của feature B thì KHÔNG share Entity và KHÔNG copy struct —
// consumer khai port hẹp đúng nhu cầu của mình, owner cắm vào qua fx:
//
//	// internal/invoice/service.go  (consumer khai port, nhận DTO chứ không nhận Entity)
//	type OrderReader interface {
//		GetByID(ctx context.Context, id string) (order.Response, error)
//	}
//
//	// cmd/server/main.go — fx nối: *order.Service đã thoả OrderReader
//	func(s *order.Service) invoice.OrderReader { return s }
//
// Một bảng có đúng MỘT feature owner: consumer không viết SQL vào bảng của owner, không
// import Repository/Store của owner. Hai feature cùng một bảng/aggregate = ranh giới vạch
// sai → gộp thành một feature (thêm endpoint), không đẩy vào shared.
//
// Type mà MỌI service đều cần (không riêng service này) thì thuộc core go-kit
// (`domain/`, `util/`) — như domain.Timestamps, response.Data[T] — không copy-paste
// sang từng service, cũng không nhét vào shared.
//
// Chi tiết + bảng 4 tình huống: docs/architecture.md · skill .claude/skills/feature-flow.
package shared
