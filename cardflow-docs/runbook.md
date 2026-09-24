# 🛠️ Cardflow Developer Runbook

Hướng dẫn chi tiết từ A-Z để cài đặt, khởi chạy và xử lý sự cố trong quá trình phát triển hệ sinh thái Cardflow.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản `>= 22.12` (Đã xác minh: v24.11.1).
- **pnpm**: Phiên bản `12.x` (Đã cài: 12.4.1).
- **Go**: Phiên bản `>= 1.22` (Đã xác minh: go1.26.5).
- **Docker**: Docker Desktop (hoặc daemon WSL2) để chạy PostgreSQL và Redis.

---

## 2. Khởi Động Nhanh (Quickstart)

Từ thư mục gốc `cardflow`:

### Cách 1: Sử dụng Root Makefile (Khuyến nghị nếu có make / git-bash)
```bash
# 1. Bật toàn bộ hệ thống (Docker DB + Backend + Web):
make dev

# Hoặc bật từng phần:
make docker-up    # Bật PostgreSQL & Redis
make backend      # Bật Go Backend (:8080)
make app          # Bật Next.js Web (:3000)
```

### Cách 2: Sử dụng Script Windows (PowerShell / CMD)
```powershell
# Bật toàn bộ:
.\run.ps1 dev

# Bật riêng lẻ:
.\run.ps1 infra     # Bật Database
.\run.ps1 backend   # Bật Go Backend
.\run.ps1 app       # Bật Next.js Web
```

---

## 3. Kiểm Tra Sức Khỏe Dịch Vụ (Health Checks)

- **Frontend Web**: Truy cập `http://localhost:3000` (Home) hoặc `http://localhost:3000/dashboard`.
- **Backend API**:
  ```bash
  curl http://localhost:8080/healthz
  # Phản hồi: 200 OK
  ```
- **PostgreSQL**:
  ```bash
  docker exec -it cardflow-postgres pg_isready -U postgres -d sample_db
  ```
- **Redis**:
  ```bash
  docker exec -it cardflow-redis redis-cli ping
  # Phản hồi: PONG
  ```

---

## 4. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 4.1. Lỗi cổng bị chiếm dụng (Port Conflict)
- Nếu cổng `3000` bị chiếm: Kiểm tra bằng `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess`.
- Nếu cổng `8080` bị chiếm: Kiểm tra tiến trình backend cũ và tắt nó.

### 4.2. Token GitHub hết hạn khi cập nhật dependencies
- Dự án sử dụng private packages từ `github.com/bangdinh`.
- Nếu gặp lỗi 401 khi clone hoặc update go/pnpm: Kiểm tra `insteadOf` trong `git config --global --list`.

---

## 5. Tích Hợp Google Cloud (Drive & Sheets)

Cardflow hỗ trợ 2 chế độ khi sử dụng Google Sheets & Google Drive:

### 5.1. Chế độ mô phỏng (Demo / Simulation Mode)
- **Mặc định**: Hoạt động ngay lập tức mà không cần bất kỳ thông tin đăng nhập Google Cloud nào.
- Khi người dùng bấm **"Xuất Google Sheets"** hoặc **"Lưu Google Drive"** trong Modal Báo Cáo, hệ thống tự động sinh liên kết mô phỏng định dạng chuẩn của Google.

### 5.2. Chế độ thật (Google Cloud Service Account)
Để xuất trực tiếp vào Google Drive & Google Sheets thật của bạn:
1. Tạo một Service Account trong Google Cloud Console và bật:
   - **Google Sheets API**
   - **Google Drive API**
2. Tạo Service Account Key định dạng JSON.
3. Thêm các biến sau vào file `cardflow-app/.env.local`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=cardflow-sa@your-project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk..."
   GOOGLE_PROJECT_ID=your-project-id
   ```
4. Khởi động lại Web App. Vào mục **Cài Đặt Hệ Thống > Google Cloud (Drive & Sheets)** bấm **"Kiểm Tra Kết Nối"** để xác nhận kết nối thành công.
