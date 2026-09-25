'use client';

import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '28px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>© 2026 <strong>Cardflow Personal</strong> • Ứng Dụng Quản Lý 1 Thẻ Cá Nhân.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/login?returnTo=/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>Đăng nhập</Link>
          <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
