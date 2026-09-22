'use client';

import { 
  LockOutlined, 
  UnlockOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  KeyOutlined, 
  SlidersOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import type { CardTheme } from './PersonalCard3D';

interface CardQuickControlsProps {
  currentTheme: CardTheme;
  isLocked: boolean;
  showSensitiveData: boolean;
  countdownSeconds?: number;
  onToggleLock: () => void;
  onToggleSensitiveData: () => void;
  onOpenChangePin: () => void;
  onOpenSetLimit: () => void;
  onThemeChange: (theme: CardTheme) => void;
}

export function CardQuickControls({
  currentTheme,
  isLocked,
  showSensitiveData,
  countdownSeconds,
  onToggleLock,
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
        {/* Lock/Unlock Toggle */}
        <button
          type="button"
          onClick={onToggleLock}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: isLocked
              ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
              : 'rgba(30, 41, 59, 0.8)',
            color: '#ffffff',
            border: isLocked
              ? '1px solid rgba(239, 68, 68, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isLocked ? '0 4px 14px rgba(239, 68, 68, 0.3)' : 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          {isLocked ? <UnlockOutlined /> : <LockOutlined style={{ color: '#ef4444' }} />}
          <span>{isLocked ? 'Mở Khóa Thẻ' : 'Khóa Thẻ Tạm Thời'}</span>
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
