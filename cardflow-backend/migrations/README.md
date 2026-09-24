# Database Migrations for cardflow-backend

Thư mục này chứa các kịch bản SQL Migration quản lý phiên bản cơ sở dữ liệu (Database Version Control) cho service **cardflow-backend**, sử dụng thư viện `golang-migrate`.

---

## 1. Quy tắc đặt tên File

Mỗi thay đổi cấu trúc Database luôn đi theo **từng cặp file `.up.sql` và `.down.sql`**:

```
migrations/
├── 000001_create_sample_table.up.sql    # SQL nâng cấp DB (Tạo bảng/thêm cột)
└── 000001_create_sample_table.down.sql  # SQL hoàn tác DB (Xóa bảng/xóa cột)
```

### Định dạng tên file:
```
{VERSION}_{TITLE}.up.sql
{VERSION}_{TITLE}.down.sql
```
- **VERSION**: Số **6 chữ số tuần tự** cho cả service = (số lớn nhất hiện có) + 1 — `000001`, `000002`… Đây là quy ước CHUẨN của service.
  - *Đụng số khi 2 nhánh song song cùng chọn 1 số là **hiếm**; người merge SAU đổi file mình sang số trống kế tiếp (rename lúc rebase).*
  - **KHÔNG** sửa/đổi số migration đã merge — DB đã deploy ghi version vào `schema_migrations`, sửa là lệch trạng thái. Đổi schema tiếp = cặp file số cao hơn.
- **TITLE**: Mô tả ngắn bằng snake_case (ví dụ: `create_users_table`, `add_phone_column`).
- **.up.sql**: Chứa câu lệnh `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `CREATE INDEX`...
- **.down.sql**: Chứa câu lệnh đảo ngược `DROP TABLE`, `ALTER TABLE DROP COLUMN`...

---

## 2. Cách chạy Migration

Sử dụng công cụ `cmd/migrate` của service:

```bash
# 1. Chạy tất cả các file migration SQL chưa áp dụng (Up)
go run ./cmd/migrate up

# 2. Hoàn tác/Rollback phiên bản DB (Down)
go run ./cmd/migrate down
```

---

## 3. Quản lý trạng thái DB

Khi chạy lệnh `up`, tiến trình sẽ tạo ra bảng hệ thống **`schema_migrations`** trong PostgreSQL để theo dõi phiên bản hiện tại. Không xóa hoặc sửa bảng hệ thống này thủ công.
