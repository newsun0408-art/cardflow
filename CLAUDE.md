# CLAUDE.md — Cardflow Fullstack Meta-Repository

Chỉ dẫn tối cao cho AI Coding Assistants (Claude Code, Cursor, Antigravity) làm việc trong hệ sinh thái **Cardflow**.

---

## 🏛️ Bản Đồ Hệ Sinh Thái

```
cardflow/
├── cardflow-app/      # Frontend Web (Next.js 16) & Mobile (Expo) dựng trên fe-kit v0.1.0
├── cardflow-backend/  # Backend Go Microservice dựng trên go-kit (Clean Architecture, Echo, fx)
├── cardflow-docs/     # Tài liệu kiến trúc, API contract, runbook vận hành
├── .agents/           # Antigravity IDE workspace skills & rules
├── .claude/           # Claude Code workspace settings
├── .cursor/           # Cursor IDE rules & mdc
├── .vscode/           # VS Code tasks & launch configurations
├── .mcp.json          # Hub kết nối TencentDB Agent Memory dùng chung cho mọi Agent
├── Makefile           # Điều phối lệnh tổng thể (make dev, make build...)
├── run.ps1 / run.bat  # Script điều phối 1-lệnh trên Windows
└── README.md          # Tài liệu tổng thể
```

---

## ⚡ Lệnh Điều Phối Nhanh

- **Khởi chạy toàn bộ hệ sinh thái (DB + Backend + Web)**:
  ```bash
  make dev             # Hoặc: .\run.ps1 dev
  ```
- **Khởi động riêng cơ sở dữ liệu (PostgreSQL 16 & Redis 7)**:
  ```bash
  make dev-infra       # Hoặc: .\run.ps1 infra
  ```
- **Chạy riêng Backend (Go :8080)**:
  ```bash
  make dev-backend     # Hoặc: .\run.ps1 backend
  ```
- **Chạy riêng Web (Next.js :3000)**:
  ```bash
  make dev-app         # Hoặc: .\run.ps1 app
  ```
- **Kiểm tra chất lượng mã nguồn trước khi commit**:
  ```bash
  make type-check      # tsc --noEmit toàn bộ app
  make lint            # oxlint
  make test            # Go unit test & Frontend test
  ```

---

## 🧠 Nguyên Tắc Agent Memory (TencentDB)

- Toàn bộ AI Agent đều chia sẻ chung một bộ nhớ qua MCP `tencent-memory` khai báo tại `.mcp.json`.
- **Tự động tra cứu**: Khi gặp câu hỏi về thông số, port, convention, lịch sử, hãy chủ động tra cứu `wiki_search`.
- **Tự động lưu**: Khi phát hiện thông tin cấu hình mới hoặc quyết định kiến trúc quan trọng, chủ động ghi nhớ qua `wiki_write`.

---

## 🔒 Quy Chuẩn Kỹ Thuật Bắt Buộc

1. **Không phá vỡ cấu trúc của `fe-kit`**:
   - Web App dùng Next.js 16 App Router, React 19, CSS Modules kết hợp Token từ `shared/src/tokens.ts`.
   - Toàn bộ thao tác cập nhật bảo mật xử lý qua Server Actions (`'use server'`).
   - Tuyệt đối không dùng `console.*` tùy tiện; sử dụng logger chuẩn từ `fe-kit/logger`.
2. **Không phá vỡ cấu trúc của `go-kit`**:
   - Backend tuân theo Feature-first: mỗi feature nằm trong 1 package `internal/<feature>/`.
   - Phản hồi HTTP tuân thủ envelope `response.NewData` / `response.NewPage` và lỗi chuẩn `RFC 9457 ProblemDetail`.
   - Prefix endpoint luôn bắt đầu bằng `/cardflow-backend/v1/`.
