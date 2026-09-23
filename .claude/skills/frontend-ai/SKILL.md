---
name: frontend-ai
description: Quy chuẩn thiết kế UI/UX theo Frontend AI (Impeccable) kết hợp fe-kit/ui cho Cardflow App. Tự kích hoạt khi viết component, CSS hoặc tinh chỉnh giao diện.
---

# Frontend AI Skill (Impeccable & fe-kit)

## Nguyên Tắc Cốt Lõi
1. **Một sự thật một chỗ**: Mọi giá trị màu sắc, spacing, font-size phải lấy từ `shared/src/tokens.ts` thông qua `fe-kit/ui`. CẤM hardcode màu hoặc px trong JSX/CSS.
2. **Không dùng thiết kế AI lối mòn (Generic AI Tells)**:
   - Cấm chữ xám trên nền màu, cấm đen/xám thuần (phải tinting màu chủ đạo).
   - Cấm lồng Card trong Card.
   - Cấm font chữ quá phổ biến (Inter/Arial cho mọi nơi).
   - Cấm animation kiểu bounce/elastic.
3. **Phản hồi người dùng linh hoạt**:
   - Sử dụng micro-animations mịn mượt cho hover/focus.
   - Luôn thiết kế chỉn chu trạng thái Loading, Empty State, Error State và Text Overflow.

## Lệnh & Luồng Thực Thi
- Khai báo token mới tại `shared/src/tokens.ts`.
- Tham chiếu hướng dẫn đầy đủ tại `DESIGN.md`.
