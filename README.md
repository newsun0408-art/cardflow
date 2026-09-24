# 💳 Cardflow — Hệ Sinh Thái Quản Lý Thẻ Thông Minh Đa Kênh

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go)](https://go.dev/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo)](https://turbo.build/)

Hệ thống quản lý phát hành, định danh và vận hành thẻ tài chính thông minh, tích hợp đồng bộ giữa ứng dụng Web, Mobile và Go Microservice hiệu năng cao.

---

## 🏛️ Cấu Trúc Hệ Thống

```
cardflow/
├── 📱 cardflow-app/       # Frontend: Next.js 16 Web App & Expo Mobile App (fe-kit)
├── ⚙️ cardflow-backend/   # Backend: Go Microservice (go-kit, Clean Arch, Echo, fx)
├── 📚 cardflow-docs/      # Tài liệu hệ thống: Architecture, API Contract, Runbook
├── 🤖 .agents/            # Workspace configuration cho Antigravity IDE
├── 🧠 .mcp.json           # Model Context Protocol kết nối TencentDB Agent Memory
├── 🛠️ Makefile            # Điểm điều phối lệnh đa nền tảng
└── ⚡ run.ps1 / run.bat    # Điểm điều phối 1-lệnh trực tiếp trên Windows
```

---

## 🚀 Khởi Chạy Nhanh (1 Câu Lệnh)

### Yêu cầu tiên quyết:
- **Node.js** `>= 22.12` | **pnpm** `12.x` | **Go** `>= 1.22` | **Docker Desktop**

### Bật toàn bộ dự án:
```powershell
# Trên Windows PowerShell:
.\run.ps1 dev

# Hoặc bằng Makefile (nếu có make / Git Bash):
make dev
```

Lệnh trên sẽ tự động:
1. 🐳 Khởi động container **PostgreSQL 16** (port `5432`) và **Redis 7** (port `6379`).
2. ⚙️ Khởi động **Cardflow Go Backend** tại `http://localhost:8080` (Health: `GET /healthz`).
3. 🌐 Khởi động **Cardflow Web Frontend** tại `http://localhost:3000` với Turbopack.

---

## 📑 Bảng Điều Hướng Cổng Dịch Vụ (Service Ports)

| Dịch vụ | URL / Địa chỉ | Chức năng |
| :--- | :--- | :--- |
| **Web Frontend** | `http://localhost:3000` | Trang chủ, Dashboard quản lý thẻ 3D, Settings |
| **Backend API** | `http://localhost:8080` | REST API (`/cardflow-backend/v1/...`) |
| **API Health Check** | `http://localhost:8080/healthz` | Probe kiểm tra trạng thái hoạt động backend |
| **Metrics Server** | `http://localhost:10254/metrics` | Prometheus metrics giám sát hệ thống |
| **PostgreSQL** | `localhost:5432` | DB: `sample_db`, User: `postgres`, Pass: `password` |
| **Redis** | `localhost:6379` | In-memory cache cho thẻ và token |
| **Memory Hub** | `http://localhost:8125` | Giao diện quản lý bộ nhớ tri thức AI Agent |

---

## 🛠️ Lệnh Phát Triển Phổ Biến

```bash
# Khởi chạy riêng rẽ từng phần
.\run.ps1 infra      # Chỉ bật Database
.\run.ps1 backend    # Chỉ chạy Go Backend (:8080)
.\run.ps1 app        # Chỉ chạy Web (:3000)
.\run.ps1 mobile     # Chỉ chạy Mobile Expo

# Kiểm tra chất lượng & Build
.\run.ps1 check      # Type-check TypeScript + lint + Go tests
.\run.ps1 build      # Build production cả Backend binary và Next.js
.\run.ps1 stop       # Dừng container Database
```

---

## 📖 Tài Liệu Tham Khảo Thêm
- [Kiến trúc chi tiết & Sơ đồ luồng](cardflow-docs/architecture.md)
- [Quy chuẩn API & Chuẩn RFC 9457](cardflow-docs/api-contract.md)
- [Developer Runbook & Troubleshooting](cardflow-docs/runbook.md)
