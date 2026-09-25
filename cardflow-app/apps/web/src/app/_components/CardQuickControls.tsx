'use client';

import { 
  DeleteOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  KeyOutlined, 
  SlidersOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import type { CardTheme } from './PersonalCard3D';

interface CardQuickControlsProps {
  currentTheme: CardTheme;
  isLocked?: boolean;
  showSensitiveData: boolean;
  countdownSeconds?: number;
  onToggleLock?: () => void;
  onDeleteCard?: () => void;
  onToggleSensitiveData: () => void;
  onOpenChangePin: () => void;
  onOpenSetLimit: () => void;
  onThemeChange: (theme: CardTheme) => void;
}

export function CardQuickControls({
  currentTheme,
  showSensitiveData,
  countdownSeconds,
  onDeleteCard,
  onToggleSensitiveData,
  onOpenChangePin,
  onOpenSetLimit,
  onThemeChange,
}: CardQuickControlsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '440px',
        margin: '24px auto 0 auto',
        width: '100%',
      }}
    >
      {/* Primary Control Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Delete Card Button */}
        <button
          type="button"
          onClick={onDeleteCard}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
          }}
        >
          <DeleteOutlined style={{ color: '#ef4444' }} />
          <span>Xóa Thẻ Khỏi Ví</span>
        </button>


        {/* Show/Hide Sensitive Info */}
        <button
          type="button"
          onClick={onToggleSensitiveData}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          {showSensitiveData ? (
            <EyeInvisibleOutlined style={{ color: '#f59e0b' }} />
          ) : (
            <EyeOutlined style={{ color: '#38bdf8' }} />
          )}
          <span>
            {showSensitiveData
              ? `Ẩn Số Thẻ/CVV ${countdownSeconds ? `(${countdownSeconds}s)` : ''}`
              : 'Hiện Số Thẻ/CVV'}
          </span>
        </button>
      </div>

      {/* Secondary Management Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          type="button"
          onClick={onOpenChangePin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <KeyOutlined style={{ color: '#fbbf24' }} />
          <span>Đổi Mã PIN</span>
        </button>

        <button
          type="button"
          onClick={onOpenSetLimit}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <SlidersOutlined style={{ color: '#38bdf8' }} />
          <span>Hạn Mức Thẻ</span>
        </button>
      </div>

      {/* Theme Swatches Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '8px 14px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BgColorsOutlined style={{ color: '#818cf8' }} /> Style Thẻ Cá Nhân:
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            title="Dark Cyber Theme"
            onClick={() => onThemeChange('dark-cyber')}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#818cf8',
              border: currentTheme === 'dark-cyber' ? '2px solid #fff' : 'none',
              cursor: 'pointer',
            }}
          />

          <button
            type="button"
            title="Gold Elegance Theme"
            onClick={() => onThemeChange('gold-elegance')}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#f59e0b',
              border: currentTheme === 'gold-elegance' ? '2px solid #fff' : 'none',
              cursor: 'pointer',
            }}
          />

          <button
            type="button"
            title="Holographic Theme"
            onClick={() => onThemeChange('holographic')}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#38bdf8',
              border: currentTheme === 'holographic' ? '2px solid #fff' : 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </div>
  );
}
