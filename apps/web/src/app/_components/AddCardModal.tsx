'use client';

import { useState } from 'react';
import { PlusOutlined, CloseOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { CardTheme } from './PersonalCard3D';

export interface CardDataModel {
  id: string;
  nickname: string;
  bankName: string;
  cardType: string;
  lastFourDigits: string;
  cardNumberFormatted: string;
  nfcId: string;
  holderName: string;
  expiryDate: string;
  cvv: string;
  theme: CardTheme;
  isLocked: boolean;
  isDefault: boolean;
  balance: number;
  dailyLimit: number;
  spentToday: number;
  onlinePayment: boolean;
  internationalPayment: boolean;
  atmWithdrawal: boolean;
  notificationsEnabled: boolean;
}

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: Omit<CardDataModel, 'id' | 'isLocked' | 'balance' | 'spentToday'>) => void;
}

const THEME_OPTIONS: { id: CardTheme; label: string; bg: string }[] = [
  { id: 'dark-cyber', label: 'Dark Cyber Platinum', bg: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #0284c7 100%)' },
  { id: 'gold-luxe', label: 'Gold Luxe VIP', bg: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)' },
  { id: 'deep-sapphire', label: 'Deep Sapphire', bg: 'linear-gradient(135deg, #0369a1 0%, #0f172a 60%, #38bdf8 100%)' },
  { id: 'crimson-ruby', label: 'Crimson Ruby', bg: 'linear-gradient(135deg, #881337 0%, #be123c 60%, #fb7185 100%)' },
];

export function AddCardModal({ isOpen, onClose, onAddCard }: AddCardModalProps) {
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('Cardflow Bank');
  const [cardType, setCardType] = useState('VISA PLATINUM');
  const [theme, setTheme] = useState<CardTheme>('dark-cyber');
  const [isDefault, setIsDefault] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    const randomLast4 = Math.floor(1000 + Math.random() * 9000).toString();
    const randomNfc = `CF-NFC-${Math.floor(1000 + Math.random() * 9000)}-PL`;

    onAddCard({
      nickname: nickname.trim(),
      bankName,
      cardType,
      lastFourDigits: randomLast4,
      cardNumberFormatted: `4889 •••• •••• ${randomLast4}`,
      nfcId: randomNfc,
      holderName: 'LÊ HUỲNH THUẬN',
      expiryDate: '09/30',
      cvv: '•••',
      theme,
      isDefault,
      dailyLimit: 30000000,
      onlinePayment: true,
      internationalPayment: true,
      atmWithdrawal: true,
      notificationsEnabled: true,
    });

    setNickname('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          padding: '28px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              <PlusOutlined />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Thêm Thẻ Cá Nhân Mới</h3>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Liên kết & tùy chỉnh giao diện thẻ</div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Card Nickname */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Tên gợi nhớ của thẻ <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Thẻ Chi Tiêu Hàng Ngày, Thẻ Online..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Bank & Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Ngân hàng phát hành
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="Cardflow Bank">Cardflow Bank</option>
                <option value="Vietcombank">Vietcombank</option>
                <option value="Techcombank">Techcombank</option>
                <option value="MB Bank">MB Bank</option>
                <option value="ACB">ACB</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Hạng thẻ
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="VISA PLATINUM">VISA PLATINUM</option>
                <option value="MASTERCARD BLACK">MASTERCARD BLACK</option>
                <option value="VISA GOLD">VISA GOLD</option>
                <option value="JCB SIGNATURE">JCB SIGNATURE</option>
              </select>
            </div>
          </div>

          {/* Theme Style Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
              Phong cách / Giao diện 3D
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {THEME_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: opt.bg,
                    border: theme === opt.id ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    boxShadow: theme === opt.id ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none',
                  }}
                >
                  <span>{opt.label}</span>
                  {theme === opt.id && <CheckCircleFilled style={{ color: '#38bdf8' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Make Default Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="make-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="make-default" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
              Đặt làm thẻ cá nhân mặc định khi thanh toán
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            }}
          >
            + Lưu & Khởi Tạo Thẻ Mới
          </button>
        </form>
      </div>
    </div>
  );
}
