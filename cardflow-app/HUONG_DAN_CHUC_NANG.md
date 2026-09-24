# 💳 Cardflow App — Tài Liệu Hướng Dẫn Tính Năng & Vận Hành

Tài liệu này tổng hợp toàn bộ các tính năng đã được phát triển, kiến trúc kỹ thuật và quy trình vận hành cho ứng dụng **Cardflow App**, tuân thủ nghiêm ngặt bộ tiêu chuẩn kỹ thuật **CueOS** và **fe-kit**.

---

## 🏛️ 1. Kiến Trúc & Quy Chuẩn Kỹ Thuật

- **Frontend Framework**: Next.js 16 App Router (Turbopack), React 19, TypeScript strict mode.
- **Design System & Tokens**: Sử dụng token màu sắc, typography và spacing chuẩn từ `shared/src/tokens.ts` và `fe-kit/ui`.
- **Thẩm mỹ giao diện**: Phong cách **Dark Cyber / Glassmorphism** cao cấp, hiệu ứng chiều sâu, viền phát sáng gradient, không sử dụng màu xám phẳng đơn điệu.
- **BFF & Server Actions**: Toàn bộ thao tác cập nhật dữ liệu quan trọng đều xử lý qua Next.js Server Actions (`'use server'`), xác thực schema chặt chẽ.
- **Hệ thống Ghi log (Logging)**: Tích hợp `createLogger` từ `fe-kit/logger`, tuân thủ nguyên tắc không sử dụng `console.*` tự do trong mã nguồn.
- **Chất lượng mã nguồn**: Đạt chuẩn 100% khi chạy `pnpm type-check` và linter `oxlint` (0 lỗi, 0 cảnh báo).

---

## 🚀 2. Chi Tiết Các Phân Hệ Chức Năng

### 👤 2.1. Phân Hệ Quản Lý & Chỉnh Sửa Thông Tin Cá Nhân (User Profile Hub)
- **Tập tin chính**: `apps/web/src/app/_components/UserProfileEditor.tsx`, `apps/web/src/app/actions/user-profile.ts`, `shared/src/profile.ts`.
- **Chức năng**:
  1. **Chỉnh sửa thông tin cơ bản**: Họ và tên, Số điện thoại (chuẩn định dạng Việt Nam), Nickname / Biệt danh hiển thị.
  2. **Tải & Xem trước Avatar tức thì**: Cho phép chọn tệp hình ảnh trực tiếp từ máy tính, tự động kiểm tra định dạng/dung lượng và hiển thị ảnh đại diện xem trước mượt mà trước khi lưu.
  3. **BFF Server Action bảo mật**: Thao tác cập nhật được gửi qua `updateUserProfileAction`, ghi log an toàn với logger `user-profile`.
  4. **Phản hồi trạng thái (Feedback UI)**: Hiển thị thông báo thành công hoặc cảnh báo lỗi trực quan với hiệu ứng chuyển động tinh tế.

---

### 💳 2.2. Phân Hệ Quản Lý Thẻ Cá Nhân Đa Chế Độ Xem (Smart Card Manager)
- **Tập tin chính**: `apps/web/src/app/_components/PersonalCard3D.tsx`.
- **Chức năng**:
  1. **Bộ chuyển đổi 3 chế độ xem (Multi-View Switcher)**:
     - **Dạng Lưới 3D (Grid View)**: Thẻ ảo mô phỏng chiều sâu 3D, hiệu ứng ánh kim (holographic sheen) di chuyển theo góc chuột, cho phép lật mặt sau để xem mã bảo mật CVV và mã QR nạp tiền nhanh.
     - **Dạng Bảng Dữ Liệu (Table View)**: Bảng thống kê cô đọng, hiển thị rõ ràng số thẻ, chủ thẻ, ngày hết hạn, hạn mức khả dụng và trạng thái kích hoạt.
     - **Dạng Danh Sách Chi Tiết (List View)**: Hiển thị thẻ theo từng hàng thẻ mở rộng, kèm lịch sử sử dụng gần nhất và thanh hạn mức chi tiêu.
  2. **Bảo vệ mã PIN (Security Shield)**: Tính năng che mờ thông tin nhạy cảm (số thẻ, CVV), yêu cầu xác thực bảo mật trước khi sao chép hoặc xem chi tiết.
  3. **Thao tác nhanh**: Khóa thẻ khẩn cấp, mở khóa thẻ, đổi mã PIN thẻ và xem sao kê giao dịch tức thì.

---

### ⚙️ 2.3. Trung Tâm Cài Đặt Toàn Diện (AppSettingsHub)
- **Tập tin chính**: `apps/web/src/app/_components/AppSettingsHub.tsx`, `apps/web/src/app/_components/AppSettingsHub.module.css`.
- **Chức năng**:
  Trung tâm cấu hình hợp nhất được chia thành 5 phân mục chuyên sâu:
  1. **Bảo Mật & Xác Thực (Security & 2FA)**:
     - Bật/tắt xác thực hai yếu tố (2FA qua Google Authenticator hoặc tin nhắn SMS OTP).
     - Thay đổi mã PIN thanh toán 6 số (yêu cầu nhập đúng PIN cũ, xác nhận PIN mới).
  2. **Thời Gian Chờ & Phiên Làm Việc (Session & Timeout)**:
     - Thiết lập tự động đăng xuất / khóa phiên sau khoảng thời gian không thao tác (15 phút, 30 phút, 1 giờ, 4 giờ) giúp bảo vệ tài khoản khi dùng máy công cộng.
  3. **Hồ Sơ Cá Nhân (Profile Sync)**:
     - Tích hợp trực tiếp màn hình chỉnh sửa thông tin người dùng ngay trong trung tâm cài đặt.
  4. **Phương Thức Thanh Toán (Payment Methods)**:
     - Bật/tắt tính năng thanh toán quốc tế (Visa/Mastercard Online), thanh toán chạm không tiếp xúc (Contactless) và cài đặt hạn mức giao dịch tối đa trong ngày.
  5. **Giao Diện & Phiên Đăng Nhập (Appearance & Sessions)**:
     - Quản lý theme giao diện (Dark Cyber, Midnight Neon).
     - Quản lý danh sách các thiết bị đang đăng nhập (Web Chrome Windows, Mobile iOS Safari...), cho phép bấm **Đăng xuất khỏi thiết bị này** từ xa.

---

### 📊 2.4. Quản Lý Tài Chính & Biểu Đồ Phân Bổ Chi Tiêu (TransactionExpenseManager)
- **Tập tin chính**: `apps/web/src/app/_components/TransactionExpenseManager.tsx`, `apps/web/src/app/_components/TransactionExpenseManager.module.css`.
- **Chức năng**:
  1. **Cụm 4 Phím Tắt Thao Tác Nhanh (Quick Actions)**:
     - **+ Nhập giao dịch**: Mở form ghi nhận khoản chi/thu mới nhanh chóng.
     - **Xuất báo cáo Excel / CSV**: Trích xuất dữ liệu tài chính phục vụ quyết toán.
     - **Đặt ngân sách tháng**: Thiết lập trần chi tiêu cho từng danh mục.
     - **Phân tích AI**: Nhận báo cáo phân tích thói quen tiêu dùng thông minh.
  2. **Thẻ Tổng Quan Thu - Chi & Tiết Kiệm**:
     - Thống kê Tổng thu nhập, Tổng chi tiêu và Tỷ lệ tiết kiệm thực tế đạt được trong tháng.
  3. **Biểu Đồ Phân Bổ Donut Phân Tầng Chống Trùng Lặp (Spaced Donut Chart)**:
     - Thiết kế vòng tròn Donut chia màu sắc sống động cho từng nhóm chi tiêu (Công nghệ, Ăn uống, Di chuyển, Nhà cửa, Còn lại...).
     - **Hệ thống mũi tên & đường chỉ nét đứt (Pointer Elbow Lines)**: Mỗi lát cắt có chấm định vị ở tâm cung và đường polyline nét đứt bẻ góc chỉ đến thẻ thông tin.
     - **Thuật toán phân bổ tầng dọc (`distributeSlots`)**: Tự động dãn cách các nhãn từ Y = 70 đến Y = 350, phân tách cột Trái và Phải độc lập, triệt để ngăn chặn tình trạng đè chữ khi có nhiều khoản chi nhỏ liền kề.
  4. **Modal Xem Chi Tiết Từng Danh Mục (Category Detail Modal)**:
     - Bấm vào bất kỳ lát bánh nào hoặc bấm vào nhãn chỉ dẫn để mở modal chi tiết chuyên sâu:
       + Số tiền đã chi vs Hạn mức ngân sách định mức.
       + Thanh đo tiến độ phần trăm chi tiêu.
       + **AI Financial Advice**: Lời khuyên thông minh được cá nhân hóa theo từng danh mục.
       + **Danh sách hóa đơn thực tế** thuộc danh mục này.
       + Phím tắt **Xem ở danh sách** (tự động điền bộ lọc bên dưới) và **Thêm khoản chi mục này**.
  5. **Bảng Giao Dịch Chi Tiết**:
     - Đã loại bỏ các nút thừa/trùng lặp.
     - Tìm kiếm giao dịch thời gian thực theo tên hoặc mô tả.
     - Bộ lọc kết hợp theo Danh mục (Tất cả, Công nghệ, Ăn uống, Di chuyển, Nhà cửa, Khác) và Trạng thái (Tất cả, Hoàn thành, Đang xử lý, Thất bại).
     - Phân trang mượt mà và hiển thị trạng thái badge màu sắc tương ứng.

---

## 🛠️ 3. Hướng Dẫn Khởi Chạy & Kiểm Định Mã Nguồn

### Cài đặt dependencies:
```bash
pnpm install
```

### Khởi chạy môi trường phát triển (Dev Server):
```bash
pnpm dev
# Ứng dụng web mở tại: http://localhost:3000/dashboard
```

### Kiểm định toàn diện trước khi Release (Quality Gates):
```bash
# 1. Typecheck toàn bộ 3 packages (@cardflow-app/web, shared, mobile):
pnpm type-check

# 2. Quét lỗi linter:
pnpm lint

# 3. Biên dịch bản dựng sản xuất (Next.js Turbopack build):
pnpm --filter @cardflow-app/web build
```

---

## 🌿 4. Quy Trình Phân Nhánh & Git Workflow (Chuẩn CueOS)

- **Nhánh tính năng**: `feature/expense-manager-and-settings`
- **Quy chuẩn commit**: `feat(web): ...`, `docs: ...`, `fix: ...`
- **Lệnh đẩy mã nguồn lên GitHub**:
  ```bash
  git push -u origin feature/expense-manager-and-settings
  ```
