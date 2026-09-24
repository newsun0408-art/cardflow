// Mô hình dữ liệu thông tin cá nhân người dùng (User Profile).
// Dùng chung cho cả web và mobile theo kiến trúc fe-kit.

export interface UserProfile {
  id: string;
  fullName: string;
  nickname: string;
  phone: string;
  email: string;
  avatarUrl?: string; // Data URL (Base64) hoặc URL ảnh từ máy
  role?: string;
  bio?: string;
  updatedAt?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr-vip-001',
  fullName: 'Lê Huỳnh Thuận',
  nickname: 'thuanle.vip',
  phone: '0912345678',
  email: 'thuan.le@cardflow.vn',
  avatarUrl: '',
  role: 'Chủ Thẻ VIP',
  bio: 'Nhà phát triển & Thành viên Cardflow Priority',
  updatedAt: '2026-09-23T12:00:00.000Z',
};
