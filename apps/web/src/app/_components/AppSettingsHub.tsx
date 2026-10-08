'use client';

import { useState, useEffect } from 'react';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  BgColorsOutlined,
  LaptopOutlined,
} from '@ant-design/icons';
import type { UserProfile } from '@cardflow-app/shared';
import { UserProfileEditor } from './UserProfileEditor';
import {
  SecurityTab,
  PaymentsTab,
  PreferencesTab,
  SessionsTab,
  type SettingsSubTab,
  type AccentColor,
  type DeviceSession,
} from '@/features/settings';
import styles from './AppSettingsHub.module.css';

export interface AppSettingsHubProps {
  userProfile: UserProfile;
  onProfileSave: (updated: UserProfile) => void;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onToast: (msg: string) => void;
}

export type { SettingsSubTab };

export function AppSettingsHub({
  userProfile,
  onProfileSave,
  isBalanceHidden,
  onToggleBalance,
  onToast,
}: AppSettingsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('security');

  // Security state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState('15');
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(true);
  const [isAutoMaskEnabled, setIsAutoMaskEnabled] = useState(true);

  // Payment preferences state
  const [notifyWebPush, setNotifyWebPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySuspicious, setNotifySuspicious] = useState(true);
  const [alertOverLimit80, setAlertOverLimit80] = useState(true);

  // Preferences state
  const [accentColor, setAccentColor] = useState<AccentColor>('cyan');
  const [parallaxTilt, setParallaxTilt] = useState(true);
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');

  // Sessions state
  const [sessions, setSessions] = useState<DeviceSession[]>([
    {
      id: 'sess-1',
      device: 'Windows 11 Pro • Chrome 134',
      location: 'TP. Hồ Chí Minh, Việt Nam',
      ip: '14.161.42.88',
      type: 'desktop',
      isCurrent: true,
      lastActive: 'Đang hoạt động',
    },
    {
      id: 'sess-2',
      device: 'iPhone 16 Pro Max • Safari iOS 18',
      location: 'TP. Hồ Chí Minh, Việt Nam',
      ip: '113.185.34.12',
      type: 'mobile',
      isCurrent: false,
      lastActive: 'Hoạt động 18 phút trước',
    },
    {
      id: 'sess-3',
      device: 'iPad Pro M4 • Cardflow Mobile App',
      location: 'Hà Nội, Việt Nam',
      ip: '27.72.102.55',
      type: 'tablet',
      isCurrent: false,
      lastActive: 'Hoạt động 2 ngày trước',
    },
  ]);

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved2FA = localStorage.getItem('cardflow_2fa_enabled');
        if (saved2FA !== null) setIs2FAEnabled(saved2FA === 'true');

        const savedAutoLock = localStorage.getItem('cardflow_autolock_timeout');
        if (savedAutoLock) setAutoLockTimeout(savedAutoLock);

        const savedBio = localStorage.getItem('cardflow_biometrics_enabled');
        if (savedBio !== null) setIsBiometricsEnabled(savedBio === 'true');

        const savedMask = localStorage.getItem('cardflow_automask_enabled');
        if (savedMask !== null) setIsAutoMaskEnabled(savedMask === 'true');

        const savedAccent = localStorage.getItem('cardflow_accent_color');
        if (savedAccent) setAccentColor(savedAccent as AccentColor);

        const savedTilt = localStorage.getItem('cardflow_parallax_tilt');
        if (savedTilt !== null) setParallaxTilt(savedTilt === 'true');

        const savedCurr = localStorage.getItem('cardflow_currency');
        if (savedCurr) setCurrency(savedCurr as 'VND' | 'USD');
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  const saveSetting = (key: string, val: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, val);
      } catch {
        // Ignore localStorage quota
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Cài Đặt Hệ Thống & Bảo Mật</h2>
        <p className={styles.subtitle}>
          Quản lý tài khoản, cấu hình bảo mật 2FA, tùy chọn thanh toán, giao diện và quản lý phiên đăng nhập
        </p>
      </div>

      {/* Sub-Tabs Bar */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeSubTab === 'security' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveSubTab('security')}
        >
          <SafetyCertificateOutlined />
          <span>Trung Tâm Bảo Mật</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'profile' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveSubTab('profile')}
        >
          <UserOutlined />
          <span>Hồ Sơ Cá Nhân</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'payments' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveSubTab('payments')}
        >
          <CreditCardOutlined />
          <span>Thanh Toán & Thẻ</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'preferences' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveSubTab('preferences')}
        >
          <BgColorsOutlined />
          <span>Tùy Biến Giao Diện</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'sessions' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveSubTab('sessions')}
        >
          <LaptopOutlined />
          <span>Thiết Bị & Phiên ({sessions.length})</span>
        </button>
      </div>

      {/* Sub-Tab 1: Security */}
      {activeSubTab === 'security' && (
        <SecurityTab
          is2FAEnabled={is2FAEnabled}
          setIs2FAEnabled={setIs2FAEnabled}
          isBiometricsEnabled={isBiometricsEnabled}
          setIsBiometricsEnabled={setIsBiometricsEnabled}
          autoLockTimeout={autoLockTimeout}
          setAutoLockTimeout={setAutoLockTimeout}
          isAutoMaskEnabled={isAutoMaskEnabled}
          setIsAutoMaskEnabled={setIsAutoMaskEnabled}
          saveSetting={saveSetting}
          onToast={onToast}
        />
      )}

      {/* Sub-Tab 2: Profile */}
      {activeSubTab === 'profile' && (
        <UserProfileEditor
          initialProfile={userProfile}
          onSaveSuccess={(updated) => {
            onProfileSave(updated);
            onToast('✅ Đã lưu hồ sơ cá nhân thành công!');
          }}
        />
      )}

      {/* Sub-Tab 3: Payments */}
      {activeSubTab === 'payments' && (
        <PaymentsTab
          isBalanceHidden={isBalanceHidden}
          onToggleBalance={onToggleBalance}
          alertOverLimit80={alertOverLimit80}
          setAlertOverLimit80={setAlertOverLimit80}
          notifyWebPush={notifyWebPush}
          setNotifyWebPush={setNotifyWebPush}
          notifyEmail={notifyEmail}
          setNotifyEmail={setNotifyEmail}
          notifySuspicious={notifySuspicious}
          setNotifySuspicious={setNotifySuspicious}
          email={userProfile.email}
          onToast={onToast}
        />
      )}

      {/* Sub-Tab 4: Preferences */}
      {activeSubTab === 'preferences' && (
        <PreferencesTab
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          parallaxTilt={parallaxTilt}
          setParallaxTilt={setParallaxTilt}
          currency={currency}
          setCurrency={setCurrency}
          saveSetting={saveSetting}
          onToast={onToast}
        />
      )}

      {/* Sub-Tab 5: Sessions */}
      {activeSubTab === 'sessions' && (
        <SessionsTab
          sessions={sessions}
          setSessions={setSessions}
          onToast={onToast}
        />
      )}
    </div>
  );
}
