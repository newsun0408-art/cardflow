'use client';

import {
  ThunderboltFilled,
  LockFilled,
  SlidersOutlined,
  MobileOutlined,
} from '@ant-design/icons';

export function FeaturesGrid() {
  return (
    <section id="overview" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 10px 0', color: '#f8fafc' }}>
          Tổng Quan Giải Pháp Fintech Cá Nhân
        </h2>
        <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '580px', margin: '0 auto' }}>
          Tất cả những gì bạn cần để quản lý duy nhất 1 thẻ cá nhân thông minh trong một giao diện duy nhất.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
            <ThunderboltFilled />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>NFC 1-Chạm Siêu Tốc</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Chia sẻ danh thiếp & hồ sơ cá nhân ngay tức thì chỉ với 1 chạm thẻ vào Smartphone.</p>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
            <LockFilled />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>Khóa Thẻ Tức Thời</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Chủ động vô hiệu hóa thẻ khi thất lạc hoặc nghi ngờ rủi ro trong 0.5s từ xa.</p>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
            <SlidersOutlined />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>Hạn Mức Chi Tiêu Ngày</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Thiết lập và tùy chỉnh hạn mức thanh toán ngày trực quan chống chi tiêu quá đà.</p>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
            <MobileOutlined />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>Đồng Bộ Web & Mobile</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Tự động đồng bộ trạng thái thẻ giữa Web App Next.js và Mobile App Expo Native.</p>
        </div>
      </div>
    </section>
  );
}
