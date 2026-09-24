'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Button, Dropdown, Layout, Menu, Typography, type MenuProps } from 'antd';
import styles from './AppShell.module.css';

const { Content, Header, Sider } = Layout;
const { Text } = Typography;

export interface AppShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string;
  userRole: string;
  tenantId: string;
}

const NAV_ITEMS: MenuProps['items'] = [
  { key: '/app', icon: '🏠', label: 'Tổng quan' },
  { key: '/app/cards', icon: '💳', label: 'Quản lý thẻ' },
  { key: '/app/transactions', icon: '💰', label: 'Giao dịch' },
  { key: '/app/settings', icon: '⚙️', label: 'Cài đặt' },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  cardholder: 'Chủ thẻ',
  corp_admin: 'Doanh nghiệp',
};

const PAGE_TITLE: Record<string, string> = {
  '/app': 'Tổng quan',
  '/app/cards': 'Quản lý thẻ',
  '/app/transactions': 'Giao dịch',
  '/app/settings': 'Cài đặt',
};

export function AppShell({ children, userName, userEmail, userRole, tenantId }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const selectedKey = Object.keys(PAGE_TITLE)
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0] ?? '/app';
  const pageTitle = PAGE_TITLE[selectedKey] ?? 'Cardflow';

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: userEmail || userName, disabled: true },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', danger: true },
  ];

  return (
    <Layout className={styles.shell}>
      <Sider
        breakpoint="lg"
        className={styles.sider}
        collapsed={collapsed}
        collapsedWidth="var(--app-shell-collapsed-width)"
        onBreakpoint={setCollapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width="var(--app-shell-sider-width)"
      >
        <div className={styles.brand}>
          <span aria-hidden="true">💳</span>
          {!collapsed && <span>Cardflow</span>}
        </div>

        <Menu
          mode="inline"
          items={NAV_ITEMS}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => router.push(key)}
        />

        <div className={styles.sidebarUser}>
          <Avatar>{userName.charAt(0).toUpperCase()}</Avatar>
          {!collapsed && (
            <div className={styles.sidebarUserDetails}>
              <Text ellipsis>{userName}</Text>
              <Text type="secondary" ellipsis>{tenantId || userEmail}</Text>
            </div>
          )}
        </div>
      </Sider>

      <Layout className={collapsed ? styles.mainCollapsed : styles.main}>
        <Header className={styles.header}>
          <Button
            aria-label={collapsed ? 'Mở rộng điều hướng' : 'Thu gọn điều hướng'}
            onClick={() => setCollapsed((value) => !value)}
            type="text"
          >
            {collapsed ? '☰' : '‹'}
          </Button>
          <Typography.Title className={styles.pageTitle} level={4}>{pageTitle}</Typography.Title>
          <Button aria-label="Thông báo" type="text">🔔</Button>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => key === 'logout' && router.push('/api/auth/logout'),
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button className={styles.userTrigger} type="text">
              <Avatar>{userName.charAt(0).toUpperCase()}</Avatar>
              <span className={styles.headerUserName}>{userName}</span>
              {userRole && <span className={styles.role}>{ROLE_LABEL[userRole] ?? userRole}</span>}
            </Button>
          </Dropdown>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
