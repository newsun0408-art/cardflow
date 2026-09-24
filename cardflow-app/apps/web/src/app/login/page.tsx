'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_ACCOUNTS } from '@/lib/mock-auth';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  ThunderboltFilled, 
  SafetyCertificateOutlined, 
  SlidersOutlined,
  LoadingOutlined,
  ScanOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

const ROLE_LABEL: Record<string, string> = {
  admin: '🛡️ Quản trị viên',
  cardholder: '💳 Chủ thẻ',
  corp_admin: '🏢 Doanh nghiệp',
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!username || !password) {
      setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setIsLoading(true);
    // Simulate quick mock login submission
    setTimeout(() => {
      window.location.href = `/api/auth/mock-login?account=0&returnTo=/dashboard`;
    }, 800);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. LEFT COLUMN: ABSTRACT BRAND SHOWCASE (Desktop) */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
        className="login-left-col"
      >
        {/* Background Abstract Geometric Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-20%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                color: '#fff',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              }}
            >
              CF
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                Cardflow <span style={{ color: '#38bdf8', fontSize: '13px' }}>Personal</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Quản Lý 1 Thẻ Cá Nhân</div>
            </div>
          </Link>
        </div>

        {/* Middle Value Proposition Text */}
        <div style={{ position: 'relative', zIndex: 1, margin: '40px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            <SafetyCertificateOutlined /> Bảo Mật Mã Hóa Sinh Trắc
          </div>

          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px 0', color: '#ffffff' }}>
            Làm Chủ Thẻ Cá Nhân <br />
            Trong Lòng Bàn Tay
          </h2>

          <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '440px', margin: '0 0 32px 0' }}>
            Trải nghiệm quản lý tài chính cá nhân thế hệ mới. Khóa thẻ 0.5s, tùy biến giao diện 3D và chia sẻ NFC 1-chạm không cần qua chi nhánh ngân hàng.
          </p>

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ThunderboltFilled />
              </div>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>NFC Instant Profile Sharing</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined />
              </div>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>Khóa Khẩn Cấp Instant 1-Tap</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SlidersOutlined />
              </div>
              <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>Kiểm Soát Hạn Mức Chi Tiêu Ngày</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', color: '#64748b' }}>
          © 2026 Cardflow Personal System • Secure OIDC Session Protected
        </div>
      </div>

      {/* 2. RIGHT COLUMN: GLASSMORPHISM LOGIN FORM */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #090d16 100%)',
          position: 'relative',
        }}
      >
        {/* Back to Home Button */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <ArrowLeftOutlined /> Trang chủ
        </Link>

        {/* Form Container Container */}
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(56, 189, 248, 0.1)',
            padding: '40px 32px',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              Đăng Nhập Hệ Thống
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Nhập tài khoản để quản lý 1 Thẻ Cá Nhân của bạn
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#fca5a5',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            {/* Username / Email Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tên đăng nhập / Email
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  transition: 'border-color 0.2s',
                }}
              >
                <input
                  type="text"
                  placeholder="name@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                  }}
                />
                <UserOutlined style={{ color: '#64748b', fontSize: '16px' }} />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Mật khẩu
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeInvisibleOutlined style={{ fontSize: '16px' }} /> : <EyeOutlined style={{ fontSize: '16px' }} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '22px' }}>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Vui lòng liên hệ quản trị viên hoặc sử dụng tính năng Đăng Nhập Nhanh Test bên dưới.');
                }}
                style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? <LoadingOutlined style={{ fontSize: '18px' }} /> : 'Đăng Nhập'}
            </button>
          </form>

          {/* Invisible Verification Badge */}
          <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '11px', color: '#64748b' }}>
            🔒 Được bảo vệ bởi reCAPTCHA Invisible & OIDC Protocol
          </div>

          {/* Biometric / Passkey Prompt Option */}
          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  window.location.href = `/api/auth/mock-login?account=0&returnTo=/dashboard`;
                }, 500);
              }}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ScanOutlined style={{ color: '#38bdf8' }} /> Đăng nhập bằng Face ID / Biometric
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>HOẶC TEST NHANH</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          {/* Quick Mock Test Accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_ACCOUNTS.map((account, idx) => (
              <a
                key={account.sub}
                href={`/api/auth/mock-login?account=${idx}&returnTo=/dashboard`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {account.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {account.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {account.email}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  {ROLE_LABEL[account.role] ?? account.role}
                </span>
              </a>
            ))}
          </div>

          {/* Enterprise SSO Button */}
          <div style={{ marginTop: '16px' }}>
            <a
              href="/api/auth/login?returnTo=/dashboard"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 0',
                textAlign: 'center',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Đăng nhập qua SSO Enterprise OIDC →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
