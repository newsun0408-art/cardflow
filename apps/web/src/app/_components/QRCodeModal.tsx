'use client';

import { CloseOutlined, QrcodeOutlined, MobileOutlined } from '@ant-design/icons';
import { PERSONAL_CARD_DATA } from './PersonalCard3D';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.2)',
          textAlign: 'center',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <CloseOutlined />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <QrcodeOutlined style={{ color: '#38bdf8', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
            Mã QR Thẻ Cá Nhân
          </h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#94a3b8' }}>
          Quét mã bằng camera điện thoại để xem chi tiết thẻ & thanh toán
        </p>

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            display: 'inline-block',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}
        >
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <rect width="200" height="200" fill="white" />
            <rect x="15" y="15" width="50" height="50" fill="#0f172a" rx="6" />
            <rect x="25" y="25" width="30" height="30" fill="white" rx="4" />
            <rect x="33" y="33" width="14" height="14" fill="#0284c7" rx="2" />
            <rect x="135" y="15" width="50" height="50" fill="#0f172a" rx="6" />
            <rect x="145" y="25" width="30" height="30" fill="white" rx="4" />
            <rect x="153" y="33" width="14" height="14" fill="#0284c7" rx="2" />
            <rect x="15" y="135" width="50" height="50" fill="#0f172a" rx="6" />
            <rect x="25" y="145" width="30" height="30" fill="white" rx="4" />
            <rect x="33" y="153" width="14" height="14" fill="#0284c7" rx="2" />
            <path
              d="M80 20h20v20H80zM110 20h10v10h-10zM80 50h10v20H80zM100 60h20v10h-20zM140 80h40v10h-40zM80 90h20v20H80zM110 100h30v10h-30zM150 110h20v30h-20zM80 130h10v40H80zM100 150h30v10h-30zM140 150h40v40h-40z"
              fill="#0f172a"
            />
            <circle cx="100" cy="100" r="16" fill="#0284c7" />
            <text x="100" y="104" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CF</text>
          </svg>
        </div>

        {/* User Info */}
        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '12px' }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
            {PERSONAL_CARD_DATA.holderName}
          </div>
          <div style={{ color: '#38bdf8', fontSize: '11px', marginTop: '2px' }}>
            {PERSONAL_CARD_DATA.cardType} • {PERSONAL_CARD_DATA.maskedCardNumber}
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '14px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <MobileOutlined />
          <span>Thanh toán 1 chạm NFC & QR Code mã hóa</span>
        </div>
      </div>
    </div>
  );
}
