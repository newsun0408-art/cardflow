# 💳 Cardflow — Hướng Dẫn Sử Dụng & Chi Tiết Tính Năng

Tài liệu hướng dẫn sử dụng và cập nhật toàn bộ các tính năng mới nhất của hệ thống **Cardflow**, bao gồm phân loại thẻ chuyên biệt, bộ lọc giao dịch nâng cao, hướng dẫn sử dụng tích hợp, và quản lý hồ sơ bảo mật.

---

## 🌟 1. Phân Loại Thẻ Theo Mục Đích Chuyên Dùng (Do Người Dùng Tự Chọn)

Hệ thống cho phép người dùng chủ động gắn nhãn mục đích chi tiêu cho từng thẻ ngân hàng để tối ưu hóa quyền lợi hoàn tiền và kiểm soát dòng tiền:

### 1.1. Danh sách phân loại có sẵn & Tự chọn:
- 🍔 **Chuyên Ăn uống & Cà phê**: Dành cho nhà hàng, quán cafe, dịch vụ đặt đồ ăn (GrabFood, ShopeeFood...).
- 🛍️ **Chuyên Mua sắm & Shopping**: Dành cho mua sắm siêu thị, trung tâm thương mại, sàn thương mại điện tử (Shopee, Lazada, TikTok Shop...).
- ✈️ **Chuyên Du lịch & Di chuyển**: Dành cho vé máy bay, khách sạn, Grab, Taxi, xăng xe.
- 💻 **Chuyên Công nghệ & Thiết bị**: Dành cho mua sắm thiết bị, thanh toán phần mềm, dịch vụ điện toán đám mây.
- 🏠 **Chuyên Hóa đơn & Sinh hoạt**: Dành cho tiền điện, nước, internet, phí chung cư.
- 📈 **Chuyên Đầu tư & Tích lũy**: Dành cho tiền tiết kiệm, đầu tư chứng khoán, bảo hiểm.
- 💳 **Chi tiêu Đa năng / Dùng chung**: Phù hợp cho chi tiêu tổng hợp hàng ngày.
- ✨ **Tự đặt mục đích riêng...**: Cho phép bạn nhập bất kỳ tên mục đích mong muốn nào (ví dụ: *Tiền chợ hàng ngày*, *Quỹ học tập con cái*, *Game & Giải trí*...).

### 1.2. Vị trí tích hợp:
1. **Khi thêm thẻ mới (`AddCardModal`)**: Tại bước thông tin & bảo mật, người dùng bấm chọn mục đích phân loại trực quan bằng nút chip hoặc gõ tên riêng.
2. **Khi chỉnh sửa thẻ (`CardsTab`)**: Nhấn nút "Sửa" trên bất kỳ thẻ nào để đổi phân loại mục đích bất cứ lúc nào.
3. **Hiển thị trên giao diện thẻ**:
   - Hiển thị huy hiệu (badge) nổi bật trên mặt trước thẻ ảo 3D (`PersonalCard3D`).
   - Hiển thị kèm tên thẻ ở cả 3 chế độ xem: **Lưới thẻ 3D**, **Bảng thống kê**, **Danh sách chi tiết**.
4. **Khi thêm giao dịch chi tiêu (`AddTransactionModal`)**: Dropdown chọn thẻ hiển thị rõ icon và tên mục đích chuyên biệt (ví dụ: `🍔 Techcombank - Thẻ Ăn Uống [Chuyên Ăn uống & Cà phê]`), giúp người dùng chọn đúng thẻ để thanh toán.

---

## ❓ 2. Nút Hướng Dẫn Sử Dụng Nhanh (`?`) Trên Header

- Tại góc trên bên phải thanh Header (cạnh avatar cá nhân), có biểu tượng nút tròn **`?`** trợ giúp.
- Khi nhấn vào nút `?`, một Modal hướng dẫn hiện đại sẽ xuất hiện với đầy đủ 5 phân mục:
  1. **Thẻ cá nhân & Thẻ 3D**: Hướng dẫn lật thẻ, đổi giao diện, khóa thẻ và gán mục đích.
  2. **Quản lý giao dịch**: Cách lọc theo ngày, ghi nhận chi tiêu/thu nhập.
  3. **Thống kê chi tiêu**: Sự khác biệt giữa màn hình Giao dịch và màn hình Thống kê biểu đồ.
  4. **Hồ sơ cá nhân**: Hướng dẫn chỉnh sửa họ tên, nickname, số điện thoại, avatar.
  5. **Google Drive & Sheet**: Hướng dẫn đồng bộ dữ liệu lên Google Drive cá nhân.

---

## 🔍 3. Quản Lý Giao Dịch & Bộ Lọc Nâng Cao

### 3.1. Xem chi tiết từng giao dịch:
- Nhấn vào bất kỳ dòng giao dịch nào trong danh sách lịch sử để mở popup xem **Chi tiết giao dịch**:
  - Mã tham chiếu giao dịch (Reference ID).
  - Tên điểm bán / Nội dung chi tiêu.
  - Số tiền (VNĐ) và phân loại Thu nhập / Chi tiêu.
  - Thẻ ngân hàng thực hiện giao dịch (kèm 4 số cuối).
  - Ngày và giờ thực hiện chính xác.
  - Trạng thái xử lý giao dịch.

### 3.2. Lọc giao dịch linh hoạt theo khoảng ngày:
- Chọn xem giao dịch **Từ ngày x tháng y năm z đến ngày a tháng b năm c**.
- Nút bấm nhanh tiện lợi: *Hôm nay*, *7 ngày qua*, *Tháng này*, hoặc chọn khoảng ngày tùy ý với Date Picker.

### 3.3. Tự động định dạng tiền tệ khi nhập:
- Khi nhập số tiền chi tiêu hoặc thu nhập trong Modal, số tiền sẽ tự động được định dạng chuẩn: `20.000.000 VNĐ`.
- Tích hợp các nút cộng nhanh số tiền: `+1.000.000`, `+5.000.000`, `+20.000.000` và nút `Xóa` nhanh.

### 3.4. Chỉnh sửa giao dịch (Edit Transaction):
- Trên mỗi dòng giao dịch hoặc ngay trong popup **Chi tiết giao dịch**, bấm nút **✏️ (Sửa)**.
- Form chỉnh sửa hiển thị **đầy đủ thông tin hiện tại**:
  - Loại giao dịch (Khoản chi tiêu / Khoản thu nhập).
  - Số tiền (tự động format VNĐ, kèm đọc thành chữ tiếng Việt).
  - Tên đơn vị / Điểm bán / Nội dung chi tiêu.
  - Danh mục chi tiêu (Ăn uống, Công nghệ, Di chuyển, Mua sắm, Nhà cửa, Đầu tư, v.v.).
  - Thẻ ngân hàng thanh toán (chọn lại thẻ khác nếu quẹt nhầm).
  - Ngày giao dịch, Giờ giao dịch, và Trạng thái (Thành công / Đang xử lý / Thất bại).
- Sau khi bấm **Lưu Thay Đổi**, hệ thống tự động cập nhật số liệu và điều chỉnh lại hạn mức/chi tiêu trong ngày của thẻ tương ứng.

### 3.5. Xóa giao dịch có xác nhận (Delete Confirmation):
- Bấm nút **🗑️ (Xóa)** trên dòng giao dịch hoặc trong popup **Chi tiết giao dịch**.
- Hộp thoại cảnh báo bảo mật Glassmorphism xuất hiện tóm tắt: Tên điểm bán, Số tiền, Thẻ thanh toán, Thời gian và Mã tham chiếu giao dịch.
- Yêu cầu xác nhận: Người dùng bấm **"Xác Nhận Xóa"** (nút màu đỏ nổi bật) để xóa vĩnh viễn, hoặc bấm **"Hủy Bỏ"** để giữ lại.
- Dữ liệu tổng chi tiêu và số tiền đã chi hôm nay của thẻ sẽ tự động được hoàn lại chính xác.

### 3.6. Quét hóa đơn tự động bằng AI (OCR Receipt Scanner):
- Bấm nút **📸 Quét Hóa Đơn AI** trên thanh tiêu đề Lịch sử giao dịch hoặc ngay trên đầu Modal **Nhập Giao Dịch Mới**.
- **3 Chế độ nhập ảnh linh hoạt**:
  1. 📸 **Chụp ảnh trực tiếp bằng Camera (Live Viewfinder)**:
     - Mở trực tiếp khung ngắm camera/webcam với giao diện HUD AI hiện đại, có 4 góc ngắm và đèn quét laser.
     - Nút **"Bấm Chụp & Quét AI"**: Chụp tức thì khung hình hiện tại và bắt đầu bóc tách thông minh.
     - Hỗ trợ nút **"Đổi Camera"** (chuyển đổi linh hoạt giữa camera trước và camera sau/góc rộng).
  2. 📱 **Mở máy ảnh gốc thiết bị (Native Camera)**:
     - Trên điện thoại (iOS / Android), bấm **"Máy Ảnh Gốc"** sẽ mở thẳng ứng dụng máy ảnh chất lượng cao của điện thoại để người dùng bấm chụp sắc nét nhất.
  3. 📁 **Tải ảnh có sẵn từ máy hoặc dùng mẫu 1-click**:
     - Chọn ảnh từ thư viện thiết bị (PNG, JPG, WebP) hoặc kéo thả trực tiếp.
     - Tự động nén & cân chỉnh độ nét qua Canvas trước khi gửi để tối ưu tốc độ nhận diện (< 3 giây).
     - 4 mẫu hóa đơn thực tế có sẵn (Highlands Coffee, Siêu thị WinMart, Cây xăng Petrolimex, Rạp CGV).
- **Trí tuệ nhân tạo (AI Vision) tự động nhận diện**:
  1. Tên điểm bán / Cửa hàng (Merchant name).
  2. Tổng số tiền thanh toán (tự động quy đổi và format chuẩn VNĐ).
  3. Phân loại danh mục tự động (Ăn uống, Mua sắm, Di chuyển, Công nghệ, Giải trí).
  4. Ngày và giờ phát sinh giao dịch.
  5. **Gợi ý thẻ thông minh**: Tự động tìm kiếm và đề xuất thẻ ngân hàng có mục đích chi tiêu tương ứng (ví dụ: hóa đơn cà phê tự chọn thẻ có nhãn *🍔 Chuyên Ăn uống*) để tối ưu quyền lợi hoàn tiền.
- **Thao tác nhanh**:
  - Bấm **"✨ Điền Vào Form Giao Dịch"**: Tự động chuyển toàn bộ dữ liệu đã quét vào form thêm giao dịch.
  - Bấm **"Lưu Giao Dịch Ngay"**: Lưu trực tiếp khoản chi vào hệ thống chỉ với một nút bấm.

---

## 📊 4. Sự Khác Biệt Giữa Trang "Giao Dịch" và Trang "Thống Kê"

| Tiêu chí | Trang Giao Dịch (Transactions) | Trang Thống Kê (Analytics / Stats) |
| :--- | :--- | :--- |
| **Mục đích** | Quản lý dòng tiền chi tiết theo từng sự kiện giao dịch phát sinh. | Phân tích bức tranh tài chính tổng thể và xu hướng chi tiêu. |
| **Góc nhìn** | Dòng thời gian (Timeline): Ai, ở đâu, lúc mấy giờ, bao nhiêu tiền. | Dữ liệu tổng hợp (Aggregate): Tỷ trọng danh mục, hạn mức, tốc độ chi tiêu. |
| **Tác vụ chính** | Thêm mới giao dịch, tìm kiếm, lọc theo ngày/danh mục, xuất file Google Sheet. | Biểu đồ tròn danh mục chi tiêu, hạn mức ngày, đánh giá cảnh báo chi tiêu vượt ngưỡng. |

---

## 🔒 5. Bảo Vệ Dữ Liệu & Cách Ly Người Dùng (Data Isolation)

- **Sửa lỗi hồ sơ cá nhân**: Đã xử lý triệt để lỗi khi người dùng có trường thông tin `nickname`, `bio`, `fullName` dạng rỗng hoặc null, bảo đảm giao diện không bao giờ bị gián đoạn.
- **Cách ly dữ liệu người dùng mới (Onboarding)**:
  - Mỗi tài khoản đăng nhập sở hữu vùng nhớ riêng biệt (`cardflow_cards_{userId}`, `cardflow_txs_{userId}`).
  - Người dùng mới tạo tài khoản sẽ vào giao diện trống tinh sạch, không bị lẫn thẻ demo mẫu của tài khoản khác, cho phép tự do thêm những thẻ thật đầu tiên của mình.

---

## ☁️ 6. Tích Hợp Google Drive & Google Sheet

- Cho phép tick chọn từng thẻ cá nhân hoặc tất cả các thẻ để xuất ra Google Sheet trong thư mục **CardFlow** trên Google Drive.
- Có tính năng xem liên kết bảng tính trực tiếp và nút xóa file an toàn trên Google Drive khi không còn nhu cầu lưu trữ.

---

## 🚀 7. Lệnh Khởi Chạy Dự Án

```bash
# Kiểm tra TypeScript
pnpm --filter @cardflow-app/web type-check

# Chạy Web App ở môi trường phát triển (Port 3000)
pnpm --filter @cardflow-app/web dev
```
