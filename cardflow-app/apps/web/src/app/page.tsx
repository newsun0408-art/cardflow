'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ThunderboltFilled, 
  SafetyCertificateOutlined, 
  LockFilled,
  MobileOutlined,
  QrcodeOutlined,
  SlidersOutlined,
  CrownFilled,
  RocketFilled,
  SearchOutlined,
  UserOutlined,
  CreditCardOutlined
} from '@ant-design/icons';

export default function LandingPage() {
  const [greeting, setGreeting] = useState('Chào buổi chiều');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #090d16 55%, #020617 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Background Decorative Ambient Mesh */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.04) 60%, transparent 80%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 1. STICKY HEADER */}
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

      {/* 2. HERO SECTION */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 80px 24px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          {/* Left Hero Content */}
          <div>
            {/* Dynamic Time Greeting */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              <CrownFilled /> {greeting}, Chủ Thẻ Cá Nhân!
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px, 4.5vw, 48px)',
                fontWeight: 900,
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                margin: '0 0 18px 0',
                background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quản Lý 1 Thẻ Cá Nhân <br /> Nhanh Tốc, An Toàn & Tối Giản
            </h1>

            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 28px 0', maxWidth: '520px' }}>
              Không rập khuôn ngân hàng truyền thống. Trải nghiệm Fintech cá nhân tích hợp chip EMV, chia sẻ NFC 1-chạm và khóa thẻ khẩn cấp trong lòng bàn tay.
            </p>

            {/* Quick Search / Feature Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                padding: '6px 8px 6px 16px',
                marginBottom: '32px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                maxWidth: '480px',
              }}
            >
              <SearchOutlined style={{ color: '#38bdf8', fontSize: '16px', marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Tìm nhanh giao dịch, hạn mức, tính năng thẻ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '13px',
                }}
              />
              <Link
                href="/login?returnTo=/dashboard"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Tra cứu →
              </Link>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                href="/login?returnTo=/dashboard"
                style={{
                  padding: '13px 28px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RocketFilled /> Đăng Nhập & Mở Khóa Thẻ
              </Link>

              <a
                href="#my-card"
                style={{
                  padding: '13px 22px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Khám phá tính năng
              </a>
            </div>
          </div>

          {/* Right Hero: Multi-Layered 3D Perspective Card Stack */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '340px' }}>
            {/* Background Ambient Glow */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
                filter: 'blur(50px)',
                zIndex: 0,
              }}
            />

            {/* Stacked Cards */}
            <div style={{ position: 'relative', width: '360px', height: '230px', perspective: '1000px' }}>
              {/* Back Card (Layer 3) */}
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '20px',
                  width: '320px',
                  height: '190px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                  transform: 'rotate(-8deg) scale(0.92)',
                  opacity: 0.7,
                  transition: 'all 0.3s ease',
                }}
              />

              {/* Middle Card (Layer 2) */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '10px',
                  width: '330px',
                  height: '195px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
                  transform: 'rotate(-4deg) scale(0.96)',
                  opacity: 0.85,
                  transition: 'all 0.3s ease',
                }}
              />

              {/* Front Main Showcase Card (Layer 1) */}
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '340px',
                  height: '200px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #0284c7 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.7), 0 0 25px rgba(56, 189, 248, 0.25)',
                  padding: '20px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transform: 'rotate(2deg)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                    CF CARDFLOW BANK
                  </span>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                    NFC CONTACTLESS
                  </span>
                </div>

                {/* EMV Chip & Masked Number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '26px',
                      borderRadius: '5px',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '2.5px', fontWeight: 600 }}>
                    •••• •••• •••• ••••
                  </div>
                </div>

                {/* Bottom Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>CHỦ THẺ CÁ NHÂN</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#cbd5e1' }}>THẺ CÁ NHÂN DEMO</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, fontStyle: 'italic', color: '#cbd5e1' }}>VISA</span>
                    <div style={{ fontSize: '8px', color: '#38bdf8', fontWeight: 700 }}>PLATINUM</div>
                  </div>
                </div>

                {/* Lock Privacy Overlay */}
                <Link
                  href="/login?returnTo=/dashboard"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(9, 13, 22, 0.65)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      color: '#38bdf8',
                      padding: '8px 16px',
                      borderRadius: '14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                    }}
                  >
                    <LockFilled /> Đăng Nhập Để Xem Thẻ Thật
                  </div>
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Chưa đăng nhập • Bảo mật thông tin</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TỔNG QUAN SECTION */}
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

      {/* 4. THẺ CỦA TÔI SECTION */}
      <section id="my-card" style={{ background: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>
            Chi Tiết Thẻ Của Tôi & Công Nghệ Bảo Mật
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '36px' }}>Trải nghiệm kiểm soát thẻ cá nhân không phụ thuộc chi nhánh ngân hàng</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
                <CreditCardOutlined /> Đổi Mã PIN Tức Thời
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>Thay đổi mã PIN 4 chữ số trực tiếp trên ứng dụng mà không cần đến cây ATM.</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
                <SafetyCertificateOutlined /> Chip EMV An Toàn
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>Tiêu chuẩn chip mã hóa phần cứng chống sao chép dữ liệu thẻ tuyệt đối.</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
                <QrcodeOutlined /> Mã QR Cá Nhân
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>Mã QR tĩnh/động hỗ trợ người khác truy cập danh thiếp của bạn tức thì.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GIAO DỊCH & HỖ TRỢ SECTION */}
      <section id="transactions" style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>Quản Lý Giao Dịch Minh Bạch</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Nhận thông báo biến động ngay khi có phát sinh chi tiêu. Phân loại tự động các khoản mua sắm, ăn uống, dịch vụ trực tuyến.
            </p>
            <Link href="/login?returnTo=/dashboard" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
              Xem chi tiết giao dịch demo →
            </Link>
          </div>

          <div id="support">
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 12px 0', color: '#ffffff' }}>Hỗ Trợ 24/7 Khi Cần</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Gặp sự cố khóa nhầm thẻ hoặc muốn nâng hạn mức? Kênh hỗ trợ ưu tiên dành riêng cho chủ thẻ cá nhân luôn sẵn sàng.
            </p>
            <a href="mailto:support@cardflow.app" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
              Liên hệ hỗ trợ cá nhân →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '28px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>© 2026 <strong>Cardflow Personal</strong> • Ứng Dụng Quản Lý 1 Thẻ Cá Nhân.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/login?returnTo=/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>Đăng nhập</Link>
            <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
