# 📜 Cardflow API Contract Specification

Quy chuẩn thiết kế và giao tiếp REST API giữa Frontend (`cardflow-app`) và Backend (`cardflow-backend`), tuân theo bộ tiêu chuẩn **VMSN-STD-API-001** và **RFC 9457**.

---

## 1. URL Path Convention

Mọi endpoint được định tuyến với prefix quy chuẩn:
```
http://localhost:8080/cardflow-backend/v1/<feature>/actions/<action>
```

- Endpoint danh sách/chi tiết: `GET /cardflow-backend/v1/<resource>/actions/view/{id}`
- Endpoint tạo mới: `POST /cardflow-backend/v1/<resource>/actions/create`
- Health probe của core: `GET /healthz` (200 OK nếu sống), `GET /readyz` (200 OK nếu sẵn sàng kết nối DB/Redis).

---

## 2. Response Formats

### 2.1. Phản hồi thành công (Success)
Sử dụng envelope `data` thống nhất:

- **Dữ liệu đơn (Single object)**:
```json
{
  "data": {
    "id": "card_01h8abc",
    "cardNumber": "**** **** **** 8829",
    "cardHolder": "NGUYEN VAN A",
    "balance": 25500000,
    "status": "ACTIVE"
  }
}
```

- **Danh sách / Phân trang (Page collection)**:
```json
{
  "data": [ ... ],
  "page": {
    "limit": 20,
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true
  }
}
```

### 2.2. Phản hồi lỗi (RFC 9457 ProblemDetail)
Không bao giờ bọc lỗi vào HTTP 200. Sử dụng đúng mã HTTP status:

```json
{
  "type": "https://errors.cardflow.vn/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "detail": "Số thẻ không đúng định dạng",
  "traceId": "c1a9e8f4-2b7d-41a9-9831-2947aef81094"
}
```

| HTTP Status | Mã lỗi nội bộ (`code`) | Ý nghĩa |
| :--- | :--- | :--- |
| `400` | `INVALID_INPUT` | Tham số truyền vào sai kiểu hoặc thiếu |
| `401` | `UNAUTHORIZED` | Chưa xác thực hoặc token hết hạn |
| `403` | `FORBIDDEN` | Không đủ quyền thực thi hành động |
| `404` | `NOT_FOUND` | Không tìm thấy bản ghi tương ứng |
| `409` | `CONFLICT` | Trùng lặp khóa hoặc vi phạm ràng buộc |
| `422` | `VALIDATION_FAILED` | Dữ liệu không thỏa mãn nghiệp vụ |
| `500` | `INTERNAL_ERROR` | Lỗi máy chủ |
