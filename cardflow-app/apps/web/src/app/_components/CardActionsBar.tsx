'use client';

import { useState } from 'react';
import { 
  DownloadOutlined, 
  QrcodeOutlined, 
  CopyOutlined, 
  CheckOutlined, 
  BgColorsOutlined
} from '@ant-design/icons';
import type { CardTheme } from './PersonalCard3D';

interface CardActionsBarProps {
  currentTheme: CardTheme;
  onThemeChange: (theme: CardTheme) => void;
  onOpenQR: () => void;
  onSaveVCard: () => void;
}

export function CardActionsBar({
  currentTheme,
  onThemeChange,
  onOpenQR,
  onSaveVCard,
}: CardActionsBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        maxWidth: '440px',
        margin: '24px auto 0 auto',
        width: '100%',
      }}
    >
      {/* Primary Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          type="button"
          onClick={onSaveVCard}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          }}
        >
          <DownloadOutlined style={{ fontSize: '15px' }} />
          Lưu Danh Bạ vCard
        </button>

        <button
          type="button"
          onClick={onOpenQR}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <QrcodeOutlined style={{ fontSize: '15px', color: '#38bdf8' }} />
          Quét Mã QR
        </button>
      </div>

      {/* Secondary Actions: Copy Link & Theme Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        {/* Copy Profile Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: copied ? '#4ade80' : '#cbd5e1',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {copied ? <CheckOutlined /> : <CopyOutlined />}
          <span>{copied ? 'Đã copy link thẻ!' : 'Copy Link Thẻ'}</span>
        </button>

        {/* Theme Swatches */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <BgColorsOutlined style={{ color: '#94a3b8', fontSize: '12px', marginRight: '2px' }} />

          <button
            type="button"
            title="Dark Cyber Theme"
            onClick={() => onThemeChange('dark-cyber')}
            style={{
              width: '18px',
              height: '18px',
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
              width: '18px',
              height: '18px',
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
              width: '18px',
              height: '18px',
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
