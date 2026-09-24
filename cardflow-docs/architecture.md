# 🏛️ Cardflow System Architecture

Tài liệu mô tả kiến trúc tổng thể, mô hình phân lớp và luồng dữ liệu của hệ sinh thái Cardflow.

---

## 1. Sơ Đồ Khối Tổng Thể (System Block Diagram)

```
[ Trình Duyệt / Web ] (Port 3000)      [ Ứng Dụng Mobile (Expo) ]
         │                                       │
         ▼                                       ▼
 ┌────────────────────────────────────────────────────────┐
 │                    CARDFLOW-APP                        │
 │  - Next.js 16 App Router (Turbopack, React 19)         │
 │  - Server Actions & Session Proxy (fe-kit/server)      │
 │  - Shared Tokens & API Client (shared/src/api.ts)      │
 └───────────────────────────┬────────────────────────────┘
                             │ HTTP (Port 8080)
                             │ Prefix: /cardflow-backend/v1
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                  CARDFLOW-BACKEND                      │
 │  - Go 1.26 Microservice (Echo + Uber fx)               │
 │  - Feature-First Packages (sample, drive, sheet...)    │
 │  - Health Probes (/healthz, /readyz)                   │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
    ┌──────────────────────┐     ┌──────────────────────┐
    │  PostgreSQL 16 (:5432)│     │    Redis 7 (:6379)   │
    │  - Card & User Data  │     │    - Cache read-thru │
    └──────────────────────┘     └──────────────────────┘
```

---

## 2. Phân Hệ Frontend (`cardflow-app`)

- **Kiến trúc Monorepo**: Quản lý bằng `pnpm` workspace và `Turborepo`.
- **`apps/web`**: 
  - Render giao diện Next.js App Router (Turbopack).
  - Sử dụng CSS Module và token chuẩn từ `shared/src/tokens.ts` (màu Cyber Dark, viền gradient, hiệu ứng 3D lật thẻ).
  - Quản lý phiên làm việc qua `fe-kit/server` với file `apps/web/src/proxy.ts`.
- **`apps/mobile`**:
  - Xây dựng bằng Expo SDK 57, React Native 0.87.
  - Sử dụng chung token UI với web.
- **`shared`**:
  - Nguồn chân lý duy nhất cho API endpoint (`shared/src/env.ts`).
  - Client gọi backend chuẩn hóa qua `shared/src/api.ts`.

---

## 3. Phân Hệ Backend (`cardflow-backend`)

- **Kiến trúc Feature-First**: Mỗi phân hệ nghiệp vụ là một package độc lập nằm dưới `internal/`:
  - `entity.go`: Domain struct thuần.
  - `dto.go`: Request/Response model.
  - `repository.go`: Port interface.
  - `service.go`: Business logic.
  - `handler.go`: HTTP adapter (Echo framework).
  - `store.go`: Cài đặt tương tác cơ sở dữ liệu PostgreSQL (`pgxpool`).
  - `cache.go`: Caching qua Redis.
- **Dependency Injection**: Tự động wire các thành phần bằng Uber fx (`app.New()`).

---

## 4. Cấu Hình Cổng Dịch Vụ (Port Mapping)

| Dịch vụ | Protocol | Port nội bộ | Port public | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Web App** | HTTP | 3000 | 3000 | Giao diện người dùng Web |
| **Backend API** | HTTP | 8080 | 8080 | REST API Go backend |
| **Metrics Server** | HTTP | 10254 | 10254 | Prometheus monitoring |
| **PostgreSQL** | TCP | 5432 | 5432 | Cơ sở dữ liệu chính |
| **Redis** | TCP | 6379 | 6379 | Caching |
| **Memory Hub** | HTTP | 8125 | 8125 | Giao diện Agent Memory |
| **Memory Core** | HTTP | 8424 | 8424 | Backend API Agent Memory |
