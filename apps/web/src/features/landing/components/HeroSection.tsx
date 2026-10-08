'use client';

import Link from 'next/link';
import {
  CrownFilled,
  RocketFilled,
  SearchOutlined,
  LockFilled,
} from '@ant-design/icons';

interface HeroSectionProps {
  greeting: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function HeroSection({ greeting, searchQuery, setSearchQuery }: HeroSectionProps) {
  return (
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
  );
}
