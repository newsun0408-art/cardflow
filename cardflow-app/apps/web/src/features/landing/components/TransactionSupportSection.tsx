'use client';

import Link from 'next/link';

export function TransactionSupportSection() {
  return (
    <section id="transactions" style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>
            Quản Lý Giao Dịch Minh Bạch
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            Nhận thông báo biến động ngay khi có phát sinh chi tiêu. Phân loại tự động các khoản mua sắm, ăn uống, dịch vụ trực tuyến.
          </p>
          <Link href="/login?returnTo=/dashboard" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
            Xem chi tiết giao dịch demo →
          </Link>
        </div>

        <div id="support">
          <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>
            Hỗ Trợ 24/7 Khi Cần
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            Gặp sự cố khóa nhầm thẻ hoặc muốn nâng hạn mức? Kênh hỗ trợ ưu tiên dành riêng cho chủ thẻ cá nhân luôn sẵn sàng.
          </p>
          <a href="mailto:support@cardflow.app" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
            Liên hệ hỗ trợ cá nhân →
          </a>
        </div>
      </div>
    </section>
  );
}
