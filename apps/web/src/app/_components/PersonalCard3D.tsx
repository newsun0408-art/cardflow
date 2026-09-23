
'use client';

import { useState, useRef } from 'react';
import { 
  SyncOutlined, 
  ThunderboltFilled, 
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SafetyCertificateFilled
} from '@ant-design/icons';

export type CardTheme = 'dark-cyber' | 'gold-elegance' | 'holographic' | 'gold-luxe' | 'deep-sapphire' | 'crimson-ruby';

interface PersonalCard3DProps {
  theme: CardTheme;
  isLocked: boolean;
  showSensitiveData: boolean;
  onToggleLock: () => void;
  onToggleSensitiveData: () => void;
  // Dynamic Card Detail Props
  holderName?: string;
  cardNumberFormatted?: string;
  lastFourDigits?: string;
  expiryDate?: string;
  cvv?: string;
  cardType?: string;
  nfcId?: string;
  bankName?: string;
}

export const PERSONAL_CARD_DATA = {
  holderName: 'LÊ HUỲNH THUẬN',
  cardNumber: '4889 7712 9041 9921',
  maskedCardNumber: '4889 •••• •••• 9921',
  expiryDate: '09/30',
  cvv: '889',
  maskedCvv: '•••',
  cardType: 'VISA PLATINUM',
  nfcId: 'CF-NFC-9921-PL',
  issuer: 'CARDFLOW BANK',
};

export function PersonalCard3D({
  theme,
  isLocked,
  showSensitiveData,
  onToggleLock,
  onToggleSensitiveData,
  holderName = PERSONAL_CARD_DATA.holderName,
  cardNumberFormatted,
  lastFourDigits = '9921',
  expiryDate = PERSONAL_CARD_DATA.expiryDate,
  cvv,
  cardType = PERSONAL_CARD_DATA.cardType,
  nfcId = PERSONAL_CARD_DATA.nfcId,
  bankName = PERSONAL_CARD_DATA.issuer,
}: PersonalCard3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const displayMaskedCardNumber = `•••• •••• •••• ${lastFourDigits}`;
  const displayFullCardNumber = cardNumberFormatted || displayMaskedCardNumber;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = -((y - centerY) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotX(rotateX);
    setRotY(rotateY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setRotX(0);
    setRotY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'gold-luxe':
      case 'gold-elegance':
        return {
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          glow: 'rgba(245, 158, 11, 0.3)',
          accent: '#f59e0b',
          textAccent: '#fbbf24',
          badgeBg: 'rgba(245, 158, 11, 0.15)',
          chipBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        };
      case 'deep-sapphire':
      case 'holographic':
        return {
          background: 'linear-gradient(135deg, #0369a1 0%, #0f172a 60%, #38bdf8 100%)',
          border: '1px solid rgba(56, 189, 248, 0.6)',
          glow: 'rgba(56, 189, 248, 0.3)',
          accent: '#38bdf8',
          textAccent: '#7dd3fc',
          badgeBg: 'rgba(56, 189, 248, 0.15)',
          chipBg: 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 100%)',
        };
      case 'crimson-ruby':
        return {
          background: 'linear-gradient(135deg, #881337 0%, #be123c 60%, #fb7185 100%)',
          border: '1px solid rgba(251, 113, 133, 0.5)',
          glow: 'rgba(251, 113, 133, 0.3)',
          accent: '#fb7185',
          textAccent: '#fecdd3',
          badgeBg: 'rgba(251, 113, 133, 0.15)',
          chipBg: 'linear-gradient(135deg, #fecdd3 0%, #e11d48 100%)',
        };
      case 'dark-cyber':
      default:
        return {
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 70%, #1e1b4b 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          glow: 'rgba(99, 102, 241, 0.25)',
          accent: '#818cf8',
          textAccent: '#a5b4fc',
          badgeBg: 'rgba(99, 102, 241, 0.15)',
          chipBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div style={{ perspective: '1200px', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          minHeight: '270px',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: isFlipped ? 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.15s ease-out',
          transform: isFlipped 
            ? 'rotateY(180deg)' 
            : `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          cursor: 'pointer',
        }}
      >
        {/* FRONT SIDE */}
        <div
          onClick={() => setIsFlipped(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '24px',
            background: styles.background,
            border: styles.border,
            boxShadow: `0 20px 40px -10px ${styles.glow}, 0 0 25px ${styles.glow}`,
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Glare overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Locked State Overlay */}
          {isLocked && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#ef4444',
              }}
            >
              <LockOutlined style={{ fontSize: '36px' }} />
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>
                THẺ ĐANG KHÓA TẠM THỜI
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock();
                }}
                style={{
                  marginTop: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UnlockOutlined /> Mở Khóa Ngay
              </button>
            </div>
          )}

          {/* Top Row: Bank Name & NFC Signal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: styles.accent,
                  fontWeight: 800,
                  fontSize: '14px',
                  border: `1px solid ${styles.accent}`,
                }}
              >
                CF
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', color: '#f8fafc' }}>
                {bankName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ThunderboltFilled style={{ color: styles.accent, fontSize: '16px' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: styles.textAccent, letterSpacing: '0.5px' }}>
                CONTACTLESS
              </span>
            </div>
          </div>

          {/* Chip EMV & Security Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
            {/* 3D Gold EMV Chip */}
            <div
              style={{
                width: '46px',
                height: '34px',
                borderRadius: '8px',
                background: styles.chipBg,
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', inset: '6px', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <SafetyCertificateFilled style={{ color: '#22c55e', fontSize: '12px' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>{cardType}</span>
            </div>
          </div>

          {/* Card Number */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.5px' }}>SỐ THẺ CÁ NHÂN</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSensitiveData();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: styles.accent,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {showSensitiveData ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                <span style={{ fontSize: '10px' }}>{showSensitiveData ? 'Ẩn' : 'Hiện số'}</span>
              </button>
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '2px',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {showSensitiveData ? displayFullCardNumber : displayMaskedCardNumber}
            </div>
          </div>

          {/* Card Bottom: Holder Name & Expiry Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '0.5px' }}>CHỦ THẺ CÁ NHÂN</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', letterSpacing: '1px', marginTop: '2px' }}>
                {holderName}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '0.5px' }}>HẾT HẠN</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', marginTop: '2px' }}>
                {expiryDate}
              </div>
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: 900,
                fontStyle: 'italic',
                color: styles.accent,
                letterSpacing: '1px',
              }}
            >
              VISA
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          onClick={() => setIsFlipped(false)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '24px',
            background: styles.background,
            border: styles.border,
            boxShadow: `0 20px 40px -10px ${styles.glow}`,
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Magnetic Strip */}
          <div
            style={{
              width: 'calc(100% + 40px)',
              margin: '-20px -20px 14px -20px',
              height: '42px',
              background: '#090d16',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          />

          {/* Signature & CVV Area */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>CHỮ KÝ CHỦ THẺ</span>
              <span style={{ fontSize: '10px', color: styles.accent, fontWeight: 700 }}>CVV / CVC</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div
                style={{
                  flex: 1,
                  height: '32px',
                  background: '#e2e8f0',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '12px',
                  fontFamily: 'cursive',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                {holderName}
              </div>

              <div
                style={{
                  width: '60px',
                  height: '32px',
                  background: '#ffffff',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#0f172a',
                }}
              >
                {showSensitiveData && cvv ? cvv : '•••'}
              </div>
            </div>
          </div>

          {/* Support Notes */}
          <div style={{ marginTop: '12px', fontSize: '10px', color: '#94a3b8', lineHeight: '1.5' }}>
            ID Thẻ: <strong>{nfcId}</strong> • Thẻ cá nhân mã hóa. Liên hệ Tổng đài 24/7: <strong>1900 8899</strong>.
          </div>

          {/* Flip Back Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
            }}
            style={{
              marginTop: '10px',
              width: '100%',
              background: styles.badgeBg,
              border: `1px solid ${styles.accent}`,
              color: styles.accent,
              borderRadius: '10px',
              padding: '8px 0',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <SyncOutlined /> Xem Mặt Trước Thẻ
          </button>
        </div>
      </div>
    </div>
  );
}
