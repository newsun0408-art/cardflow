# BÁO CÁO CÔNG VIỆC (23/09/2026) & KẾ HOẠCH PHÁT TRIỂN MOBILE CHO NGÀY MAI

> **Dự án**: Cardflow (Hệ sinh thái Thẻ cá nhân điện tử thông minh)  
> **Tác giả thực hiện**: Antigravity Pair-Programming Agent & Le Huynh Thuan  
> **Thời gian cập nhật**: 23:30 - Ngày 23/09/2026  

---

# PHẦN 1: TỔNG KẾT CÔNG VIỆC ĐÃ HOÀN THÀNH HÔM NAY (23/09/2026)

Hôm nay đã giải quyết thành công 2 trọng tâm kỹ thuật lớn nhất của dự án: **Tái cấu trúc triệt để Frontend Web** và **Kết nối dữ liệu thực với Go Backend & PostgreSQL**.

## 1. Tái Cấu Trúc Module Frontend Web (`apps/web`)

### 1.1. Vấn đề trước khi xử lý
- **File nguyên khối quá dài ("God Files")**: 
  - `src/app/dashboard/page.tsx` dài hơn **2.170 dòng** (chứa hỗn tạp cả logic gọi API, state modal, 3 tab giao diện, bộ đếm PIN, đồ thị).
  - `TransactionExpenseManager.tsx` dài hơn **1.230 dòng**.
  - `AppSettingsHub.tsx` dài gần **900 dòng**.
  - `app/page.tsx` (Landing) dài hơn **550 dòng**.
- **Xung đột cấu trúc thư mục**: Tồn tại thư mục rác `src/app/app/` sao chép lộn xộn các component của `/dashboard`.

### 1.2. Giải pháp & Kết quả triển khai
Chuyển đổi toàn diện sang **Feature-Driven Architecture** chuẩn công nghiệp:
- **Tạo 4 modules tính năng độc lập tại `apps/web/src/features/`**:
  1. `features/dashboard/`:
     - Tách toàn bộ logic nghiệp vụ (gọi backend, mã PIN, ẩn số dư, lọc thẻ) thành custom hook tái sử dụng `useDashboardState.ts`.
     - Tách UI thành các component tinh gọn: `DashboardSidebar`, `DashboardHeader`, `DashboardModals`, `OverviewTab`, `CardsTab`.
  2. `features/transactions/`:
     - Tách thành `ExpenseCharts`, `TransactionFeed`, `AddTransactionModal`, `ExpenseAnalyticsModals`.
  3. `features/settings/`:
     - Tách 4 tab cài đặt riêng biệt: `SecurityTab`, `PaymentsTab`, `PreferencesTab`, `SessionsTab`.
  4. `features/landing/`:
     - Tách Landing page thành 6 section chuyên biệt: `LandingNavbar`, `HeroSection`, `FeaturesGrid`, `SecurityDetailsSection`, `TransactionSupportSection`, `LandingFooter`.
- **Dọn sạch 100% rác**: Đã xóa sạch thư mục trùng lặp `src/app/app/`.

### 1.3. Bảng số liệu thu gọn code
| File / Module | Trước khi tách | Sau khi tách | Tỷ lệ giảm dòng | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| `dashboard/page.tsx` | **2.174 dòng** | **230 dòng** | **- 89.4%** | ✅ Hoàn thành |
| `TransactionExpenseManager.tsx` | **1.234 dòng** | **180 dòng** | **- 85.4%** | ✅ Hoàn thành |
| `AppSettingsHub.tsx` | **894 dòng** | **230 dòng** | **- 74.3%** | ✅ Hoàn thành |
| `app/page.tsx` (Landing) | **556 dòng** | **68 dòng** | **- 87.8%** | ✅ Hoàn thành |
| Thư mục rác `src/app/app/` | 7 files thừa | Đã xóa bỏ | **100%** | ✅ Đã dọn sạch |

---

## 2. Kết Nối Toàn Diện Với Go Backend (`cardflow-backend`) & PostgreSQL

### 2.1. Hạ tầng cơ sở dữ liệu
- Container Docker `cardflow-postgres` chạy tại cổng `5433` (database: `sample_db`).
- Schema các bảng `cards` và `transactions` đã được nạp và quản lý toàn vẹn dữ liệu cho chủ thẻ **LÊ HUỲNH THUẬN** (`usr-001`).

### 2.2. Khảo sát & Kích hoạt Go Backend API
- Backend Go phục vụ tại cổng `http://localhost:8080`.
- Xác thực thành công các endpoint REST API:
  - `GET /healthz` -> Trả về `{"service":"cardflow-backend","status":"ok"}`.
  - `GET /api/v1/cards` -> Trả về danh sách thẻ thực trong DB (`card-001`, `card-002`, `card-01a0cf05`).
  - `POST /api/v1/cards` -> Tạo thẻ mới vào database (đã chạy thử tạo thành công thẻ VISA GOLD).
  - `PATCH /api/v1/cards/:id/status` -> Khóa/Mở khóa trạng thái thẻ tức thời.
  - `GET /api/v1/transactions` -> Trả về 5 giao dịch thực (MacBook Pro M3 Max, Căn hộ Vinhomes, GrabCar, Lương, Haidilao).
  - `POST /api/v1/transactions` -> Tạo giao dịch mới đồng bộ vào Postgres.

### 2.3. Tích hợp phía Web Frontend
- Cập nhật gói `@cardflow-app/shared`:
  - Khai báo hàm API `createCard`, `CreateCardDto` dùng chung.
  - Tinh chỉnh `createApi`: Tự động loại bỏ header cấm `origin` khi chạy trên trình duyệt client-side, ngăn chặn triệt để lỗi `TypeError: Failed to fetch`.
  - Cấu hình `shared/src/env.ts` và `apps/web/next.config.ts` tự động liên kết tới `http://localhost:8080`.
- Đấu nối vào hook `useDashboardState.ts`:
  - Mở trang Dashboard tự động fetch thẻ và giao dịch thực tế từ backend.
  - Khi người dùng bấm Khóa thẻ / Thêm thẻ / Thêm giao dịch trên giao diện, dữ liệu lập tức được đồng bộ xuống backend Go và PostgreSQL.

---

## 3. Tiêu Chuẩn Chất Lượng Đạt Được (Quality Gates)
- **TypeScript Typecheck (`pnpm run type-check`)**: **0 lỗi** trên toàn bộ 3 packages (`@cardflow-app/shared`, `@cardflow-app/web`, `@cardflow-app/mobile`).
- **Linter (`pnpm run lint`)**: **0 cảnh báo, 0 lỗi** trên 65 files mã nguồn.
- **Production Build (`pnpm --filter @cardflow-app/web build`)**: Biên dịch thành công 100% bằng Turbopack cho 9 routes tĩnh và động.
- **Runtime**: Next.js Dev Server (`http://localhost:3000`) đang kết nối mượt mà với Go Backend (`http://localhost:8080`).

---

# PHẦN 2: KẾ HOẠCH TRIỂN KHAI CHO NGÀY MAI (MOBILE FRONTEND - `apps/mobile`)

## 1. Hiện Trạng Của Ứng Dụng Mobile (`apps/mobile`)
- Dự án sử dụng nền tảng: **React Native 0.87.1**, **Expo 57**, **Expo Router 57**.
- Đã liên kết sẵn với `@cardflow-app/shared` và `fe-kit/tokens`.
- Hiện tại mới chỉ có màn hình khởi tạo cơ bản (`app/index.tsx`), chưa có giao diện nghiệp vụ thẻ hay thanh điều hướng.

---

## 2. Mục Tiêu Phát Triển Mobile Ngày Mai
Đưa ứng dụng Mobile lên cùng đẳng cấp tính năng và trải nghiệm với bản Web:
1. Xây dựng cấu trúc điều hướng dạng **Tab Navigation** di động mượt mà (Bottom Tabs).
2. Xây dựng giao diện Thẻ Cá Nhân 3D/Neon Card thu nhỏ cho mobile với thao tác vuốt lướt thẻ (Swipeable Carousel).
3. Đấu nối trực tiếp mobile với Go Backend (`http://localhost:8080` hoặc IP máy nội bộ) thông qua `@cardflow-app/shared`.
4. Hỗ trợ thao tác chạm nhanh: Khóa thẻ 1 chạm, quét QR/NFC giả lập, xem biến động giao dịch gần nhất.

---

## 3. Kiến Trúc Đề Xuất Cho `apps/mobile`

```text
apps/mobile/
├── app/
│   ├── _layout.tsx                     # Root Stack Provider & SafeAreaProvider
│   └── (tabs)/
│       ├── _layout.tsx                 # Bottom Tab Bar Navigation (4 tabs)
│       ├── index.tsx                   # Tab 1: Tổng quan (Home / Overview)
│       ├── cards.tsx                   # Tab 2: Ví Thẻ cá nhân (My Cards)
│       ├── transactions.tsx            # Tab 3: Lịch sử & Chi tiêu (Transactions)
│       └── settings.tsx                # Tab 4: Cài đặt & Bảo mật (Settings)
│
├── src/
│   ├── features/
│   │   ├── cards/
│   │   │   ├── components/
│   │   │   │   ├── MobileCardItem.tsx          # Thẻ ATM/Credit hiển thị gradient neon
│   │   │   │   ├── CardCarousel.tsx            # Vuốt ngang chọn thẻ hoạt họa
│   │   │   │   ├── QuickCardActions.tsx        # Cụm nút: Khóa, Chuyển tiền, Chi tiết
│   │   │   │   └── AddCardBottomSheet.tsx      # Sheet trượt lên thêm thẻ mới
│   │   │   └── hooks/
│   │   │       └── useMobileCards.ts           # Hook lấy thẻ từ @cardflow-app/shared
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   │   ├── TransactionRow.tsx          # Dòng giao dịch tối ưu màn hình cảm ứng
│   │   │   │   └── MiniExpenseChart.tsx        # Biểu đồ tóm tắt thu chi
│   │   │   └── hooks/
│   │   │       └── useMobileTransactions.ts
│   │   │
│   │   └── settings/
│   │       └── components/
│   │           ├── SecuritySection.tsx         # Thiết lập FaceID / PIN
│   │           └── ProfileCard.tsx             # Thông tin cá nhân người dùng
│   │
│   └── components/
│       ├── ScreenContainer.tsx                 # SafeArea wrapper đồng bộ giao diện
│       └── StatBadge.tsx                       # Huy hiệu trạng thái nhỏ
```

---

## 4. Lộ Trình Triển Khai Chi Tiết Ngày Mai Theo Khung Giờ

### ☀️ Buổi Sáng (08:30 - 12:00): Cấu Trúc Khung & Tab Điều Hướng (Navigation)
- **Bước 1**: Cài đặt gói thư viện biểu tượng di động tương thích Expo (`@expo/vector-icons`).
- **Bước 2**: Thiết lập Expo Router Layout `app/(tabs)/_layout.tsx`:
  - 4 tabs với icon sắc nét: **Tổng quan** (Home), **Ví thẻ** (CreditCard), **Giao dịch** (Receipt), **Cài đặt** (Settings).
  - Tùy biến thanh TabBar phong cách Dark Luxe (nền đen mờ kính, viền neon, hiệu ứng tab active).
- **Bước 3**: Tạo màn hình khung của 4 tab với `ScreenContainer` bảo đảm hiển thị chuẩn trên cả tai thỏ (Notch / Dynamic Island) của iOS và thanh trạng thái Android.

### 🌤️ Buổi Chiều (13:30 - 17:30): Feature Thẻ & Kết Nối Backend
- **Bước 4**: Xây dựng Component `MobileCardItem.tsx`:
  - Hiển thị đầy đủ thông tin: Logo ngân hàng, Loại thẻ (Titanium/Cyber), Số thẻ ẩn `•••• 2345`, Tên chủ thẻ `LE HUYNH THUAN`, Hạn dùng.
  - Áp dụng màu Gradient sang trọng bằng LinearGradient hoặc View styling thuần token.
- **Bước 5**: Dựng hook `useMobileCards.ts`:
  - Gọi hàm `getCards(api)` từ `@cardflow-app/shared`.
  - Hỗ trợ cơ chế Pull-to-Refresh (kéo xuống để cập nhật lại dữ liệu từ Postgres).
- **Bước 6**: Xây dựng tính năng **Khóa/Mở thẻ tức thời**:
  - Bấm nút Khóa/Mở trên mobile -> gọi `updateCardStatus(api, cardId, status)`.
  - Cập nhật tức thì badge "Đang hoạt động" / "Đã khóa" trên thẻ.

### 🌙 Buổi Tối (18:30 - 21:30): Giao Dịch & Hoàn Thiện Trải Nghiệm Mobile
- **Bước 7**: Xây dựng Tab **Giao dịch (Transactions)**:
  - Hiển thị danh sách giao dịch phân theo ngày (MacBook Pro, Vinhomes, GrabCar,...).
  - Badge phân biệt màu sắc: Màu xanh lá (+) cho Thu nhập, Màu đỏ/trắng (-) cho Chi tiêu.
- **Bước 8**: Xây dựng Tab **Cài đặt (Settings)**:
  - Hiển thị thẻ định danh chủ tài khoản Lê Huỳnh Thuận.
  - Toggle bật tắt thông báo, tùy chọn ẩn số dư.
- **Bước 9**: Kiểm thử toàn diện Quality Gates:
  - Chạy `pnpm run type-check` (đảm bảo không xung đột type giữa web và mobile).
  - Chạy `pnpm run lint`.
  - Kiểm tra chạy thực tế trên máy ảo hoặc thiết bị qua Expo Go.

---

## 5. Danh Sách Việc Cần Lưu Ý
1. **Quy tắc nền tảng của `fe-kit`**:
   - Tuyệt đối **không import** `fe-kit/ui` trong `apps/mobile` (vì `fe-kit/ui` chỉ dành cho web với Ant Design).
   - Sử dụng `fe-kit/tokens` để lấy mã màu và khoảng cách padding/margin dùng chung.
2. **Địa chỉ IP máy thật khi test mobile**:
   - Khi chạy trên điện thoại thật qua Expo Go, `localhost:8080` của Go backend phải được truy cập qua IP mạng LAN (ví dụ: `http://192.168.1.x:8080`). Sẽ cấu hình `NEXT_PUBLIC_API_GATEWAY_URI` hoặc biến môi trường tương ứng trong `apps/mobile`.
