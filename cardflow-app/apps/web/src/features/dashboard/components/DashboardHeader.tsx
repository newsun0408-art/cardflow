'use client';

import {
  SearchOutlined,
  CloseCircleFilled,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { DashboardTab } from '../types';
import type { UserProfile } from '@cardflow-app/shared';

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  cardsCount: number;
  backendStatus?: 'checking' | 'connected' | 'offline';
  txSearchQuery: string;
  setTxSearchQuery: (val: string) => void;
  isBalanceHidden: boolean;
  onToggleHideBalance: () => void;
  onOpenAddCard: () => void;
  userProfile: UserProfile;
  getUserInitials: (name: string) => string;
}

export function DashboardHeader({
  activeTab,
  setActiveTab,
  cardsCount,
  backendStatus = 'checking',
  txSearchQuery,
  setTxSearchQuery,
  isBalanceHidden,
  onToggleHideBalance,
  onOpenAddCard,
  userProfile,
  getUserInitials,
}: DashboardHeaderProps) {
  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      {/* Breadcrumb / Title */}
      <div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
          {activeTab === 'overview' && 'Bảng Quản Lý Thẻ Cá Nhân — Tổng Quan'}
          {activeTab === 'cards' && 'Danh Sách Thẻ Cá Nhân Của Tôi'}
          {activeTab === 'transactions' && 'Lịch Sử Giao Dịch Chi Tiết'}
          {activeTab === 'stats' && 'Thống Kê & Báo Cáo Phân Tích Chi Tiêu'}
          {activeTab === 'settings' && 'Cài Đặt Tài Khoản & Bảo Mật'}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Cardflow Dashboard • {cardsCount}/5 Thẻ Cá Nhân Đang Hoạt Động</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background:
                backendStatus === 'connected'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : backendStatus === 'checking'
                  ? 'rgba(234, 179, 8, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color:
                backendStatus === 'connected'
                  ? '#34d399'
                  : backendStatus === 'checking'
                  ? '#facc15'
                  : '#f87171',
              border: `1px solid ${
                backendStatus === 'connected'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : backendStatus === 'checking'
                  ? 'rgba(234, 179, 8, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
            }}
          >
            {backendStatus === 'connected' && '● ĐÃ KẾT NỐI BACKEND (PORT 8080)'}
            {backendStatus === 'checking' && '◌ Đang kết nối Backend...'}
            {backendStatus === 'offline' && '○ Backend Offline (Mock Mode)'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '8px 14px',
          width: '260px',
        }}
        className="topbar-search"
      >
        <SearchOutlined style={{ color: '#64748b', marginRight: '8px', flexShrink: 0 }} />
        <input
          type="search"
          name="topbar_search_tx_no_autofill"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="Tìm nhanh giao dịch, thẻ..."
          value={txSearchQuery}
          onChange={(e) => setTxSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '13px',
            width: '100%',
          }}
        />
        {txSearchQuery ? (
          <button
            type="button"
            onClick={() => setTxSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            title="Xóa tìm kiếm"
          >
            <CloseCircleFilled style={{ fontSize: '14px' }} />
          </button>
        ) : null}
      </div>

      {/* User & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onOpenAddCard}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
          }}
        >
          <PlusOutlined /> Thêm thẻ mới
        </button>

        {/* Quick Balance Privacy Toggle */}
        <button
          type="button"
          onClick={onToggleHideBalance}
          style={{
            background: isBalanceHidden ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${isBalanceHidden ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: isBalanceHidden ? '#38bdf8' : '#cbd5e1',
            padding: '8px 12px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          title={isBalanceHidden ? 'Hiển thị số dư' : 'Ẩn số dư bảo mật'}
        >
          {isBalanceHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          <span>{isBalanceHidden ? 'Số dư: Ẩn' : 'Số dư: Hiện'}</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingLeft: '12px',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('settings')}
          title="Nhấp để chuyển tới Cài đặt & chỉnh sửa hồ sơ"
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              color: '#ffffff',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            {userProfile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getUserInitials(userProfile.fullName)
            )}
          </div>
          <div className="topbar-username">
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              {userProfile.fullName}
            </div>
            <div style={{ fontSize: '10px', color: '#38bdf8' }}>
              {userProfile.nickname ? `@${userProfile.nickname}` : (userProfile.role ?? 'Chủ Thẻ VIP')}
            </div>
          </div>

          <a
            href="/api/auth/logout"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              marginLeft: '4px',
            }}
            title="Đăng xuất"
          >
            <LogoutOutlined style={{ fontSize: '14px' }} />
          </a>
        </div>
      </div>
    </header>
  );
}
