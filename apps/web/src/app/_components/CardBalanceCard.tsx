'use client';

import { useState } from 'react';
import {
  WalletOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

interface CardBalanceCardProps {
  balance: number;
  dailyLimit: number;
  spentToday: number;
  rewardPoints: number;
  isBalanceHidden?: boolean;
  onToggleHideBalance?: () => void;
}

export function CardBalanceCard({
  balance,
  dailyLimit,
  spentToday,
  rewardPoints,
  isBalanceHidden,
  onToggleHideBalance,
}: CardBalanceCardProps) {
  const [localHidden, setLocalHidden] = useState(false);
  const hidden = isBalanceHidden !== undefined ? isBalanceHidden : localHidden;
  const toggleHidden = onToggleHideBalance || (() => setLocalHidden(!localHidden));

  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const usagePercent = Math.min(100, Math.round((spentToday / dailyLimit) * 100));

  return (
    <div
      style={{
        maxWidth: '440px',
        margin: '24px auto 0 auto',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '20px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WalletOutlined style={{ color: '#38bdf8', fontSize: '18px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            SỐ DƯ & HẠN MỨC THẺ
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.12)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <TrophyOutlined style={{ color: '#f59e0b', fontSize: '12px' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
            {rewardPoints.toLocaleString()} PTS
          </span>
        </div>
      </div>

      {/* Main Balance */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Số Dư Khả Dụng Trong Thẻ</div>
          <button
            type="button"
            onClick={toggleHidden}
            style={{
              background: hidden ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${hidden ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: hidden ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            title={hidden ? 'Hiển thị số dư' : 'Ẩn số dư bảo mật'}
          >
            {hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            <span>{hidden ? 'Hiện số dư' : 'Ẩn số dư'}</span>
          </button>
        </div>

        <div style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80', fontFamily: 'monospace', letterSpacing: hidden ? '2px' : 'normal' }}>
          {hidden ? '•••••••• ₫' : formatVND(balance)}
        </div>
      </div>

      {/* Limit Progress */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCartOutlined style={{ color: '#a78bfa' }} /> Chi tiêu hôm nay:
          </span>
          <span style={{ fontWeight: 700, color: '#f8fafc', fontFamily: hidden ? 'monospace' : 'inherit' }}>
            {hidden ? '••••••' : formatVND(spentToday)} / {hidden ? '••••••' : formatVND(dailyLimit)}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${usagePercent}%`,
              height: '100%',
              background: usagePercent > 80
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #38bdf8, #818cf8)',
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#64748b' }}>
          <span>Đã sử dụng {usagePercent}% hạn mức ngày</span>
          <span>Còn lại: {hidden ? '•••••••• ₫' : formatVND(dailyLimit - spentToday)}</span>
        </div>
      </div>
    </div>
  );
}
