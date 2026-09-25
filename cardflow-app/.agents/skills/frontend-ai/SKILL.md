---
name: frontend-ai
description: Quy chuẩn thiết kế UI/UX theo Frontend AI (Impeccable) kết hợp fe-kit/ui cho Cardflow App. Tự kích hoạt khi xây dựng hoặc sửa đổi giao diện frontend.
---

# Frontend AI Skill (Impeccable & fe-kit)

## Nguyên Tắc Cốt Lõi
1. **Không hardcode giá trị**: Mọi mã màu, font-size, radius, spacing phải lấy từ `shared/src/tokens.ts` (kết hợp `fe-kit/ui`). Cấm hardcode màu/px trong JSX.
2. **Loại bỏ vết tích thiết kế AI mẫu (Anti-Patterns)**:
   - Không chữ xám trên nền màu, không dùng đen/xám thuần (luôn pha màu chủ đạo - tinting).
   - Tránh lồng Card vào bên trong Card khác.
   - Không dùng font mặc định lối mòn.
   - Tránh animation kiểu nảy (bounce/elastic).
3. **Quy trình hoàn thiện UI**:
   - `shape`: Định hình UX/UI trước khi code.
   - `colorize`: Phối màu chiến lược, loại bỏ xám chết.
   - `typeset`: Cân chỉnh cấp độ font chữ và line-height.
   - `harden`: Xử lý mượt các edge cases (text overflow, empty state, error).