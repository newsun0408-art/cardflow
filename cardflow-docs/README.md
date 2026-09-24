# 📚 Cardflow Documentation Hub

Tài liệu kỹ thuật và hướng dẫn vận hành toàn diện cho hệ sinh thái **Cardflow**.

---

## 📑 Danh Mục Tài Liệu

| Tài liệu | Nội dung chính |
| :--- | :--- |
| **[architecture.md](./architecture.md)** | Kiến trúc tổng thể, mô hình phân lớp, luồng dữ liệu giữa Frontend & Backend |
| **[api-contract.md](./api-contract.md)** | Chuẩn giao tiếp REST API (RFC 9457 ProblemDetail, envelope `data`) |
| **[runbook.md](./runbook.md)** | Hướng dẫn cài đặt, cấu hình môi trường, khởi chạy hệ thống & xử lý sự cố |

---

## 🏛️ Tổng Quan Hệ Sinh Thái

Cardflow là nền tảng quản lý thẻ thông minh đa kênh gồm các phân hệ:

1. **`cardflow-app` (Frontend)**:
   - **Web App**: Next.js 16 (Turbopack, React 19, Ant Design, Dark Cyber Glassmorphism).
   - **Mobile App**: React Native (Expo SDK 57).
   - **Foundation**: `fe-kit` v0.1.0, Token-based design system.

2. **`cardflow-backend` (Backend)**:
   - **Core Engine**: Go (Go 1.26), Clean Architecture, Uber fx DI, Echo Web Framework.
   - **Data Stores**: PostgreSQL 16 (Database chính), Redis 7 (Cache read-through).
   - **Integrations**: Google Drive API, Google Sheets API, Prometheus Metrics (`:10254`).
   - **Foundation**: `go-kit` (FLI-Platform Go Microservice Standard).

3. **Agent Memory Hub**:
   - Tích hợp **TencentDB Agent Memory** qua chuẩn MCP (`.mcp.json`) cho phép mọi AI Agent (Antigravity, Claude Code, Cursor) chia sẻ chung bộ nhớ và ngữ cảnh dự án.
