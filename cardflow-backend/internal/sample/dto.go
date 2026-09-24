package sample

// --- Request Models: shape request HTTP, dùng cho middleware/validation.BindAndValidate ---
// Convention Body/Query/Params + tag `jsonschema` = validate FORMAT ngay ở cổng vào
// (required, minLength, enum, kiểu...). Đây là type của HANDLER, dính HTTP.

// CreateRequest là body của POST tạo sample.
type CreateRequest struct {
	Body struct {
		Name string `json:"name" jsonschema:"required,minLength=1"`
		// TODO: thêm field + ràng buộc jsonschema
	}
}

// GetRequest là path param của GET by id.
type GetRequest struct {
	Params struct {
		ID string `json:"sampleId" jsonschema:"required"`
	}
}

// --- Command/Input: hợp đồng VÀO của Service. KHÔNG tag json/jsonschema, không dính HTTP. ---
// Handler map Request Model -> Command; service chỉ biết Command (độc lập giao thức).

// CreateInput là input nghiệp vụ cho Service.Create.
type CreateInput struct {
	Name string
	// TODO: thêm field
}

// --- DTO: Entity map sang output an toàn cho client. ---

// Response là DTO trả về client. Chỉ expose field client được thấy —
// không bao giờ lộ field nội bộ/nhạy cảm.
type Response struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	// TODO: thêm field
}
