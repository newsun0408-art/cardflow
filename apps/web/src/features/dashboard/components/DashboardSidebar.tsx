'use client';

import Link from 'next/link';
import {
  AppstoreOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  PieChartOutlined,
  SettingOutlined,
  HomeOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import type { DashboardTab } from '../types';

interface DashboardSidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean) => void;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export function DashboardSidebar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  activeTab,
  setActiveTab,
}: DashboardSidebarProps) {
  const MENU_ITEMS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Tổng quan', icon: <AppstoreOutlined /> },
    { id: 'cards', label: 'Thẻ của tôi', icon: <CreditCardOutlined /> },
    { id: 'transactions', label: 'Giao dịch', icon: <HistoryOutlined /> },
    { id: 'stats', label: 'Thống kê', icon: <PieChartOutlined /> },
    { id: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
  ];

  return (
    <aside
      style={{
        width: isSidebarCollapsed ? '72px' : '240px',
        background: 'rgba(15, 23, 42, 0.9)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
      className="dashboard-sidebar"
    >
      <div>
        {/* Top Logo & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', marginBottom: '32px' }}>
          {!isSidebarCollapsed && (
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  color: '#fff',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                }}
              >
                CF
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Cardflow</div>
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>Personal VIP</div>
              </div>
            </Link>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: activeTab === item.id ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(56, 189, 248, 0.15) 100%)' : 'transparent',
                border: activeTab === item.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                color: activeTab === item.id ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === item.id ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                transition: 'all 0.2s ease',
              }}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Link */}
      <div>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#cbd5e1',
            textDecoration: 'none',
            fontSize: '13px',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <HomeOutlined />
          {!isSidebarCollapsed && <span>Trang giới thiệu</span>}
        </Link>
      </div>
    </aside>
  );
}
