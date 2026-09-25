# DESIGN.md — Cardflow App Frontend Design System (Impeccable & fe-kit)

Hệ thống thiết kế UI/UX cho Cardflow App áp dụng quy chuẩn **Skill Frontend AI (Impeccable)** từ bộ nhớ chung `2Cueos` kết hợp với khung **`fe-kit/ui`**.

---

## 🎨 1. Định Hướng Mỹ Thuật & Anti-Patterns (Cấm)

### ❌ Anti-Patterns Cần Tránh:
- **Không dùng font mặc định / phổ biến lặp lại**: Tránh `Arial`, `Inter` nguyên bản cho mọi thứ. Dùng typography có tính cách riêng (ví dụ `Outfit`, `Plus Jakarta Sans`, `Lexend`).
- **Không dùng chữ xám trên nền màu**: Luôn giữ contrast ratio chuẩn WCAG AA (>4.5:1).
- **Không dùng màu xám / đen thuần (Pure `#000` / `#888`)**: Luôn pha thêm sắc thái (tinting) của tone màu chủ đạo vào màu xám/tối.
- **Không lồng Card trong Card**: Tránh tạo các khung thẻ chồng chéo vô mục đích làm rối không gian nhìn.
- **Không dùng animation kiểu nảy (Bounce/Elastic easing)**: Sử dụng hiệu ứng chuyển động mượt mà (`cubic-bezier(0.16, 1, 0.3, 1)` hoặc `ease-out`).

### ✨ Định Hướng Mỹ Thuật Impeccable:
- **Tone Màu & Tinting**: Sử dụng màu sắc hài hòa, có điểm nhấn chiến lược (`colorize`).
- **Typography & Hierarchy**: Phân cấp kích thước font rõ ràng (`typeset`), tương phản tốt giữa Heading và Body.
- **Nhịp Thuyết Visual (Visual Rhythm & Layout)**: Spacing chuẩn hóa, khoảng thở hợp lý, nhịp chuyển nhất quán giữa các section.
- **Purposeful Motion & Delight**: Micro-animations mượt khi tương tác hover, focus, state transitions.

---

## 🔒 2. Quy Tắc Một Sự Thật (Single Source of Truth)

1. **Token màu & kích thước**: Mọi mã màu, font-size, radius, spacing **BẮT BUỘC** khai báo tại `shared/src/tokens.ts`.
2. **Không Hardcode**: Nghiêm cấm viết mã màu (`#2563eb`), giá trị px cứng (`padding: 13px`) trực tiếp trong JSX/CSS của React component.
3. **Theme Mode**: Hỗ trợ đầy đủ Dark Mode / Light Mode với token linh hoạt theo `tokensFor(mode)`.

---

## 🚀 3. Các Lệnh Thiết Kế Frontend AI (Impeccable Flow)

Khi phát triển hoặc cải tiến giao diện, áp dụng các quy trình:
- **`shape`**: Lập kế hoạch UX/UI & luồng tương tác trước khi viết code.
- **`craft`**: Thiết kế mẫu và tinh chỉnh giao diện trực quan.
- **`colorize`**: Phối màu chiến lược, loại bỏ xám chết.
- **`typeset`**: Cân chỉnh font chữ và khoảng cách dòng.
- **`harden`**: Xử lý trạng thái lỗi, loading, empty state, text overflow.
- **`polish`**: Tinh chỉnh cuối cùng, căn chỉnh theo token hệ thống trước khi ship.
