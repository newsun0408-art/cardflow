'use client';

import Link from 'next/link';
import { UserOutlined } from '@ant-design/icons';

export function LandingNavbar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '17px',
              color: '#fff',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            }}
          >
            CF
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.4px', color: '#f8fafc' }}>
              Cardflow <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>Personal</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Quản Lý 1 Thẻ Cá Nhân</div>
          </div>
        </Link>

        {/* Horizontal Navigation Menu */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          <a href="#overview" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>
            Tổng quan
          </a>
          <a href="#my-card" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>
            Thẻ của tôi
          </a>
          <a href="#transactions" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>
            Giao dịch
          </a>
          <a href="#support" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>
            Hỗ trợ
          </a>
        </nav>

        {/* Right Header Action Button */}
        <Link
          href="/login?returnTo=/dashboard"
          style={{
            padding: '9px 22px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <UserOutlined /> Đăng nhập
        </Link>
      </div>
    </header>
  );
}
