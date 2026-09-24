'use client';

import React, { useState, useEffect } from 'react';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  BgColorsOutlined,
  LaptopOutlined,
  MobileOutlined,
  TabletOutlined,
  KeyOutlined,
  QrcodeOutlined,
  BellOutlined,
  CheckCircleFilled,
  LogoutOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  TableOutlined,
  SyncOutlined,
  GoogleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { UserProfile } from '@cardflow-app/shared';
import { UserProfileEditor } from './UserProfileEditor';
import {
  getGoogleAuthUrlAction,
  checkGoogleConnectionStatusAction,
  type GoogleConnectionStatusResult,
} from '../actions/google-integration';
import styles from './AppSettingsHub.module.css';

export interface AppSettingsHubProps {
  userProfile: UserProfile;
  onProfileSave: (updated: UserProfile) => void;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onToast: (msg: string) => void;
  initialSubTab?: SettingsSubTab;
}

export type SettingsSubTab = 'profile' | 'security' | 'payments' | 'preferences' | 'sessions' | 'cloud';

export function AppSettingsHub({
  userProfile,
  onProfileSave,
  isBalanceHidden,
  onToggleBalance,
  onToast,
  initialSubTab,
}: AppSettingsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab || 'security');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // ==========================================
  // GOOGLE CLOUD INTEGRATION STATE (GO BACKEND OAUTH)
  // ==========================================
  const [googleConnection, setGoogleConnection] = useState<GoogleConnectionStatusResult | null>(null);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const checkGoogleConnection = async () => {
    setIsCheckingGoogle(true);
    try {
      const savedState = typeof window !== 'undefined' ? localStorage.getItem('cardflow_google_state') : null;
      if (!savedState) {
        setGoogleConnection({ success: true, connected: false });
        return;
      }
      const status = await checkGoogleConnectionStatusAction(savedState);
      setGoogleConnection(status);
      if (status.connected) {
        onToast('✨ Google Drive & Sheets đã kết nối thành công (Thư mục: CardFlow)');
      } else {
        localStorage.removeItem('cardflow_google_state');
        setGoogleConnection({ success: true, connected: false });
        onToast('ℹ️ Chưa có tài khoản Google nào được cấp quyền cho phiên này.');
      }
    } catch {
      onToast('⚠️ Lỗi kiểm tra kết nối Google Drive & Sheets');
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await getGoogleAuthUrlAction();
      if (!res.success || !res.authUrl || !res.state) {
        onToast(`⚠️ Lỗi khởi tạo liên kết Google: ${res.error || 'Vui lòng thử lại'}`);
        setIsConnectingGoogle(false);
        return;
      }

      const state = res.state;
      localStorage.setItem('cardflow_google_state', state);

      const width = 560;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        res.authUrl,
        'CardflowGoogleOAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      let attempts = 0;
      const maxAttempts = 45;
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const status = await checkGoogleConnectionStatusAction(state);
          if (status.connected) {
            clearInterval(pollTimer);
            try { popup?.close(); } catch {}
            setGoogleConnection(status);
            setIsConnectingGoogle(false);
            onToast('🎉 Kết nối Google Drive & Sheets thành công! Thư mục "CardFlow" đã sẵn sàng.');
          } else if (attempts >= maxAttempts || (popup && popup.closed)) {
            const finalCheck = await checkGoogleConnectionStatusAction(state);
            if (finalCheck.connected) {
              clearInterval(pollTimer);
              setGoogleConnection(finalCheck);
              setIsConnectingGoogle(false);
              onToast('🎉 Kết nối Google Drive & Sheets thành công! Thư mục "CardFlow" đã sẵn sàng.');
            } else if (attempts >= maxAttempts) {
              clearInterval(pollTimer);
              setIsConnectingGoogle(false);
            }
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setIsConnectingGoogle(false);
          }
        }
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onToast(`⚠️ Lỗi kết nối Google: ${msg}`);
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem('cardflow_google_state');
    setGoogleConnection({ success: true, connected: false });
    onToast('ℹ️ Đã ngắt kết nối tài khoản Google khỏi phiên làm việc này');
  };

  // ==========================================
  // SECURITY STATE
  // ==========================================
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFACodeInput, setTwoFACodeInput] = useState('');
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const mock2FASecret = 'CARDFLOW-8841-SEC-2FA';

  const [autoLockTimeout, setAutoLockTimeout] = useState('15');
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(true);
  const [isAutoMaskEnabled, setIsAutoMaskEnabled] = useState(true);

  // Change PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // ==========================================
  // PAYMENT PREFERENCES STATE
  // ==========================================
  const [notifyWebPush, setNotifyWebPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySuspicious, setNotifySuspicious] = useState(true);
  const [alertOverLimit80, setAlertOverLimit80] = useState(true);
  const [defaultOnlinePay, setDefaultOnlinePay] = useState(true);
  const [defaultInternational, setDefaultInternational] = useState(false);
  void defaultOnlinePay;
  void defaultInternational;
  void setDefaultOnlinePay;
  void setDefaultInternational;

  // ==========================================
  // PREFERENCES STATE
  // ==========================================
  const [accentColor, setAccentColor] = useState<'cyan' | 'gold' | 'emerald' | 'ruby'>('cyan');
  const [parallaxTilt, setParallaxTilt] = useState(true);
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');

  // ==========================================
  // SESSIONS STATE
  // ==========================================
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [sessions, setSessions] = useState([
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
        if (savedAccent) setAccentColor(savedAccent as any);

        const savedTilt = localStorage.getItem('cardflow_parallax_tilt');
        if (savedTilt !== null) setParallaxTilt(savedTilt === 'true');

        const savedCurr = localStorage.getItem('cardflow_currency');
        if (savedCurr) setCurrency(savedCurr as any);
      } catch {
        // Ignore storage read issues
      }
    }
  }, []);

  // Save changes to localStorage
  const saveSetting = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore
      }
    }
  };

  // Handlers for 2FA
  const handleToggle2FA = () => {
    if (is2FAEnabled) {
      setIs2FAEnabled(false);
      saveSetting('cardflow_2fa_enabled', 'false');
      onToast('🛡️ Đã tắt xác thực 2 bước (2FA)');
    } else {
      setTwoFACodeInput('');
      setTwoFAError(null);
      setIs2FAModalOpen(true);
    }
  };

  const handleVerifyAndEnable2FA = () => {
    if (twoFACodeInput.trim().length !== 6 || !/^\d{6}$/.test(twoFACodeInput.trim())) {
      setTwoFAError('Vui lòng nhập đúng mã xác thực 6 chữ số từ ứng dụng');
      return;
    }
    setIs2FAEnabled(true);
    saveSetting('cardflow_2fa_enabled', 'true');
    setIs2FAModalOpen(false);
    onToast('✅ Đã kích hoạt xác thực 2 bước (2FA) thành công!');
  };

  // Handlers for Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (currentPin.length !== 4 && currentPin.length !== 6) {
      setPinError('Mã PIN hiện tại phải gồm 4 hoặc 6 chữ số');
      return;
    }
    if (newPin.length !== 4 && newPin.length !== 6) {
      setPinError('Mã PIN mới phải gồm 4 hoặc 6 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Mã PIN xác nhận không trùng khớp với mã PIN mới');
      return;
    }
    if (newPin === currentPin) {
      setPinError('Mã PIN mới phải khác mã PIN hiện tại');
      return;
    }

    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    onToast('🔑 Đã cập nhật mã PIN bảo mật ứng dụng thành công!');
  };

  // Handlers for Revoke Sessions
  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setIsRevokeModalOpen(false);
    onToast('🔒 Đã đăng xuất khỏi tất cả các thiết bị khác thành công');
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

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'cloud' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveSubTab('cloud')}
        >
          <CloudUploadOutlined />
          <span>Google Cloud (Drive & Sheets)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TRUNG TÂM BẢO MẬT (SECURITY) */}
      {/* ========================================================================= */}
      {activeSubTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Box 1: 2FA & Sinh trắc học */}
          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <SafetyCertificateOutlined style={{ color: '#38bdf8' }} />
                  Xác Thực & Bảo Vệ Tài Khoản
                </div>
                <div className={styles.sectionDesc}>
                  Ngăn chặn truy cập trái phép bằng nhiều lớp phòng vệ nghiêm ngặt
                </div>
              </div>
            </div>

            {/* 2FA Toggle */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Xác thực hai yếu tố (2FA / OTP)</div>
                <div className={styles.rowItemHint}>
                  Yêu cầu mã 6 số từ ứng dụng xác thực (Google Authenticator / Authy) khi đăng nhập
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: is2FAEnabled ? '#4ade80' : '#94a3b8' }}>
                  {is2FAEnabled ? 'ĐÃ BẬT' : 'CHƯA BẬT'}
                </span>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={is2FAEnabled}
                    onChange={handleToggle2FA}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>

            {/* Biometrics Toggle */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Đăng nhập sinh trắc học (Face ID / Vân tay)</div>
                <div className={styles.rowItemHint}>
                  Cho phép xác thực khuôn mặt / dấu vân tay qua WebAuthn API khi mở ứng dụng
                </div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={isBiometricsEnabled}
                  onChange={(e) => {
                    setIsBiometricsEnabled(e.target.checked);
                    saveSetting('cardflow_biometrics_enabled', String(e.target.checked));
                    onToast(e.target.checked ? '⚡ Đã bật xác thực sinh trắc học' : '🔒 Đã tắt sinh trắc học');
                  }}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {/* Auto Lock Timeout */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Tự động khóa ứng dụng (Session Timeout)</div>
                <div className={styles.rowItemHint}>
                  Tự động khóa màn hình và yêu cầu mã PIN khi không có thao tác tương tác
                </div>
              </div>
              <select
                className={styles.selectControl}
                value={autoLockTimeout}
                onChange={(e) => {
                  setAutoLockTimeout(e.target.value);
                  saveSetting('cardflow_autolock_timeout', e.target.value);
                  onToast(`⏱️ Đã đặt tự động khóa: ${e.target.value === 'never' ? 'Không bao giờ' : `Sau ${e.target.value} phút`}`);
                }}
              >
                <option value="1">Sau 1 phút</option>
                <option value="5">Sau 5 phút</option>
                <option value="15">Sau 15 phút (Khuyên dùng)</option>
                <option value="30">Sau 30 phút</option>
                <option value="never">Không bao giờ khóa</option>
              </select>
            </div>

            {/* Auto Mask Sensitive Info */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Tự động che số thẻ & mã CVV</div>
                <div className={styles.rowItemHint}>
                  Tự động ẩn số thẻ sau 10 giây khi mở xem chi tiết để chống nhìn lén nơi công cộng
                </div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={isAutoMaskEnabled}
                  onChange={(e) => {
                    setIsAutoMaskEnabled(e.target.checked);
                    saveSetting('cardflow_automask_enabled', String(e.target.checked));
                    onToast(e.target.checked ? '👁️‍🗨️ Đã bật tự động che thẻ' : '👁️ Đã tắt che thẻ');
                  }}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>

          {/* Box 2: Đổi mã PIN Ứng Dụng */}
          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <KeyOutlined style={{ color: '#38bdf8' }} />
                  Đổi Mã PIN Bảo Mật Ứng Dụng
                </div>
                <div className={styles.sectionDesc}>
                  Mã PIN dùng để xác thực nhanh khi xem thông tin thẻ, mở khóa hoặc phê duyệt giao dịch
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
              {pinError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '13px' }}>
                  {pinError}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mã PIN hiện tại</label>
                <input
                  type="password"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 4 hoặc 6 số"
                  className={styles.inputField}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mã PIN mới</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập mã PIN mới"
                  className={styles.inputField}
                  required
                />
                {newPin && (
                  <div style={{ fontSize: '11px', color: newPin.length === 6 ? '#4ade80' : '#38bdf8', marginTop: '2px' }}>
                    Độ an toàn: {newPin.length === 6 ? '🛡️ Rất mạnh (6 chữ số)' : '⚡ Tiêu chuẩn (4 chữ số)'}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Xác nhận mã PIN mới</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập lại mã PIN mới"
                  className={styles.inputField}
                  required
                />
              </div>

              <button type="submit" className={styles.primaryBtn} style={{ marginTop: '8px' }}>
                <CheckCircleFilled /> Cập Nhật Mã PIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: HỒ SƠ CÁ NHÂN (PROFILE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'profile' && (
        <UserProfileEditor
          initialProfile={userProfile}
          onSaveSuccess={(updated) => {
            onProfileSave(updated);
            onToast('✅ Đã lưu hồ sơ cá nhân thành công!');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: THANH TOÁN & THẺ (PAYMENTS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <CreditCardOutlined style={{ color: '#38bdf8' }} />
                  Tùy Chọn Hiển Thị Số Dư & Thẻ
                </div>
                <div className={styles.sectionDesc}>
                  Kiểm soát cách dữ liệu tài chính của bạn hiển thị trên toàn màn hình
                </div>
              </div>
            </div>

            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Ẩn số dư & hạn mức toàn hệ thống</div>
                <div className={styles.rowItemHint}>
                  Tự động chuyển số tiền hiển thị thành '•••••••• ₫' trên Dashboard và Danh sách thẻ
                </div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={isBalanceHidden}
                  onChange={onToggleBalance}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Cảnh báo vượt 80% hạn mức ngày</div>
                <div className={styles.rowItemHint}>
                  Phát chuông thông báo khi tổng chi tiêu trong ngày đạt ngưỡng 80% hạn mức thẻ
                </div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={alertOverLimit80}
                  onChange={(e) => {
                    setAlertOverLimit80(e.target.checked);
                    onToast(e.target.checked ? '🔔 Đã bật cảnh báo hạn mức 80%' : '🔕 Đã tắt cảnh báo hạn mức');
                  }}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>

          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <BellOutlined style={{ color: '#38bdf8' }} />
                  Kênh Nhận Thông Báo Biến Động
                </div>
                <div className={styles.sectionDesc}>
                  Nhận tin nhắn tức thời mỗi khi thẻ phát sinh giao dịch chi tiêu hoặc nhận tiền
                </div>
              </div>
            </div>

            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Thông báo đẩy trình duyệt (Web Push)</div>
                <div className={styles.rowItemHint}>Nhận thông báo nổi ngay góc màn hình khi phát sinh giao dịch</div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={notifyWebPush}
                  onChange={(e) => setNotifyWebPush(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Gửi sao kê & hóa đơn qua Email</div>
                <div className={styles.rowItemHint}>Gửi chi tiết hóa đơn điện tử về hộp thư {userProfile.email}</div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Cảnh báo giao dịch đáng ngờ (Fraud Alert)</div>
                <div className={styles.rowItemHint}>Tự động khóa tạm thời khi có giao dịch lạ bất thường từ nước ngoài</div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={notifySuspicious}
                  onChange={(e) => setNotifySuspicious(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: TÙY BIẾN GIAO DIỆN (PREFERENCES) */}
      {/* ========================================================================= */}
      {activeSubTab === 'preferences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <BgColorsOutlined style={{ color: '#38bdf8' }} />
                  Giao Diện & Màu Sắc Điểm Nhấn
                </div>
                <div className={styles.sectionDesc}>
                  Tùy chỉnh sắc thái không gian Dark Cyber theo sở thích cá nhân
                </div>
              </div>
            </div>

            {/* Accent Theme Picker */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Màu điểm nhấn (Cyber Accent Theme)</div>
                <div className={styles.rowItemHint}>Tông màu phát sáng cho các nút bấm, viền và trạng thái active</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'cyan', label: 'Neon Cyan', color: '#38bdf8', border: '#0284c7' },
                  { id: 'gold', label: 'Gold Luxe', color: '#f59e0b', border: '#d97706' },
                  { id: 'emerald', label: 'Emerald', color: '#10b981', border: '#059669' },
                  { id: 'ruby', label: 'Crimson Ruby', color: '#ef4444', border: '#dc2626' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAccentColor(item.id as any);
                      saveSetting('cardflow_accent_color', item.id);
                      onToast(`🎨 Đã chọn tông màu: ${item.label}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: accentColor === item.id ? `${item.color}22` : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${accentColor === item.id ? item.color : 'rgba(255, 255, 255, 0.1)'}`,
                      color: accentColor === item.id ? item.color : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, display: 'inline-block' }}></span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Tilt Performance Toggle */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Hiệu ứng 3D Parallax & Kim Loại Phản Chiếu</div>
                <div className={styles.rowItemHint}>Tắt hiệu ứng nghiêng 3D nếu máy yếu hoặc muốn tiết kiệm pin tối đa</div>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={parallaxTilt}
                  onChange={(e) => {
                    setParallaxTilt(e.target.checked);
                    saveSetting('cardflow_parallax_tilt', String(e.target.checked));
                    onToast(e.target.checked ? '✨ Đã bật hiệu ứng 3D Parallax mượt mà' : '⚡ Đã bật chế độ tiết kiệm hiệu năng');
                  }}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {/* Currency Unit */}
            <div className={styles.rowItem}>
              <div>
                <div className={styles.rowItemLabel}>Đơn vị tiền tệ chính</div>
                <div className={styles.rowItemHint}>Quy chuẩn hiển thị đơn vị tiền trên biểu đồ và hạn mức</div>
              </div>
              <select
                className={styles.selectControl}
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value as any);
                  saveSetting('cardflow_currency', e.target.value);
                  onToast(`💵 Đã chuyển đơn vị tiền tệ: ${e.target.value}`);
                }}
              >
                <option value="VND">Việt Nam Đồng (₫ - VND)</option>
                <option value="USD">Đô La Mỹ ($ - USD)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: THIẾT BỊ & PHIÊN LÀM VIỆC (SESSIONS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <LaptopOutlined style={{ color: '#38bdf8' }} />
                  Thiết Bị Đang Đăng Nhập ({sessions.length})
                </div>
                <div className={styles.sectionDesc}>
                  Theo dõi danh sách các trình duyệt và thiết bị đang duy trì phiên hoạt động
                </div>
              </div>

              {sessions.length > 1 && (
                <button
                  className={styles.dangerBtn}
                  onClick={() => setIsRevokeModalOpen(true)}
                >
                  <LogoutOutlined /> Đăng xuất khỏi thiết bị khác
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`${styles.deviceItem} ${sess.isCurrent ? styles.deviceItemActive : ''}`}
                >
                  <div className={styles.deviceInfo}>
                    <div className={styles.deviceIcon}>
                      {sess.type === 'desktop' && <LaptopOutlined />}
                      {sess.type === 'mobile' && <MobileOutlined />}
                      {sess.type === 'tablet' && <TabletOutlined />}
                    </div>

                    <div className={styles.deviceMeta}>
                      <div className={styles.deviceName}>
                        {sess.device}
                        {sess.isCurrent && (
                          <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            THIẾT BỊ NÀY
                          </span>
                        )}
                      </div>
                      <div className={styles.deviceDetails}>
                        {sess.location} • IP: {sess.ip} • <span style={{ color: sess.isCurrent ? '#4ade80' : '#94a3b8' }}>{sess.lastActive}</span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      className={styles.ghostBtn}
                      style={{ fontSize: '12px' }}
                      onClick={() => {
                        setSessions((prev) => prev.filter((s) => s.id !== sess.id));
                        onToast(`🔒 Đã đăng xuất thiết bị: ${sess.device}`);
                      }}
                    >
                      Đăng xuất
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* OIDC Session Status Box */}
          <div className={styles.cardBox}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <SafetyCertificateOutlined style={{ color: '#4ade80' }} />
                  Trạng Thái Phiên Doanh Nghiệp (OIDC Enterprise)
                </div>
                <div className={styles.sectionDesc}>
                  Hạ tầng phiên bảo mật tiêu chuẩn điều khiển bởi gói `fe-kit/server`
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                ⚡ SECURE SSO ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '12px', color: '#94a3b8' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b' }}>Nhà cung cấp danh tính (IdP):</div>
                <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>Cardflow Enterprise OIDC / Keycloak</div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b' }}>Phương thức bảo mật:</div>
                <div style={{ color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>PKCE + HttpOnly Secure Cookie Proxy</div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b' }}>Thời gian hết hạn phiên:</div>
                <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>Tự động làm mới (Anti-race lock)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: TÍCH HỢP GOOGLE CLOUD (DRIVE & SHEETS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'cloud' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Overview Card */}
          <div className={styles.sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GoogleOutlined style={{ color: '#38bdf8' }} />
                  <span>Trạng Thái Tích Hợp Google Cloud (Go Backend)</span>
                </h3>
                <p className={styles.sectionSubtitle}>
                  Cấp quyền OAuth 2.0 an toàn. Go Backend tự động quản lý token và tự động tạo thư mục <strong>CardFlow</strong> trên Drive của bạn.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: googleConnection?.connected
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(148, 163, 184, 0.15)',
                    color: googleConnection?.connected ? '#34d399' : '#94a3b8',
                    border: googleConnection?.connected
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(148, 163, 184, 0.3)',
                  }}
                >
                  <CheckCircleFilled />
                  {googleConnection?.connected
                    ? 'ĐÃ KẾT NỐI (Thư mục: CardFlow)'
                    : 'CHƯA KẾT NỐI TÀI KHOẢN'}
                </span>

                {googleConnection?.connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ngắt kết nối
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: isConnectingGoogle ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    {isConnectingGoogle ? (
                      <>
                        <LoadingOutlined /> Đang mở xác thực...
                      </>
                    ) : (
                      <>
                        <GoogleOutlined /> Kết Nối Google Ngay
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={checkGoogleConnection}
                  disabled={isCheckingGoogle}
                  className={styles.ghostBtn}
                  style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <SyncOutlined spin={isCheckingGoogle} />
                  <span>{isCheckingGoogle ? 'Đang kiểm tra...' : 'Kiểm Tra Đồng Bộ'}</span>
                </button>
              </div>
            </div>

            {googleConnection?.connected && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CloudUploadOutlined style={{ color: '#34d399', fontSize: '16px' }} />
                  <span style={{ color: '#cbd5e1' }}>Thư mục lưu trữ trên Google Drive:</span>
                  <strong style={{ color: '#34d399' }}>CardFlow</strong>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  Đã tải {googleConnection.files?.length ?? 0} file từ Google Drive
                </span>
              </div>
            )}
          </div>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Feature 1: Google Sheets */}
            <div className={styles.sectionCard} style={{ border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '20px' }}>
                  <TableOutlined />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                    Google Sheets (Bảng Tính Thông Minh)
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Tự động tạo & định dạng chuẩn bảng sao kê tài chính
                  </p>
                </div>
              </div>

              <ul style={{ margin: '0 0 16px 0', paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8' }}>
                <li>Đầy đủ header báo cáo, thông tin chủ thẻ và ngày lập.</li>
                <li>Tự động tính tổng Thu, Chi tiêu và biến động ròng bằng công thức <code>=SUM(...)</code>.</li>
                <li>Định dạng màu sắc tài chính (đỏ cho chi tiêu, xanh cho hoàn tiền).</li>
                <li>Mở ngay trên trình duyệt mà không cần cài đặt phần mềm.</li>
              </ul>
            </div>

            {/* Feature 2: Google Drive */}
            <div className={styles.sectionCard} style={{ border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '20px' }}>
                  <CloudUploadOutlined />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                    Google Drive (Lưu Trữ & Sao Lưu)
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Tự động phân loại vào thư mục <code>Cardflow_Reports</code>
                  </p>
                </div>
              </div>

              <ul style={{ margin: '0 0 16px 0', paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.8' }}>
                <li>Tự động khởi tạo thư mục <code>Cardflow_Reports</code> trên Google Drive.</li>
                <li>Lưu trữ vĩnh viễn các file sao kê dạng CSV/PDF phục vụ quyết toán thuế.</li>
                <li>Cấp quyền xem nhanh và tạo liên kết chia sẻ tức thời.</li>
                <li>Không bao giờ lo mất dữ liệu khi thay đổi thiết bị cá nhân.</li>
              </ul>
            </div>
          </div>

          {/* Configuration Guide Box */}
          <div className={styles.sectionCard} style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️ Hướng Dẫn Cấu Hình Kết Nối Thật (Google Cloud Console)</span>
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8' }}>
              Để kích hoạt tài khoản Google Cloud thật của bạn, hãy thêm các biến sau vào file <code>cardflow-app/.env.local</code>:
            </p>
            <div style={{ background: '#020617', padding: '14px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#38bdf8', overflowX: 'auto', lineHeight: '1.6' }}>
              <div># Cấu hình Google Cloud Service Account:</div>
              <div>GOOGLE_SERVICE_ACCOUNT_EMAIL=cardflow-sa@your-project-id.iam.gserviceaccount.com</div>
              <div>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk..."</div>
              <div>GOOGLE_PROJECT_ID=your-project-id</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: KÍCH HOẠT 2FA */}
      {/* ========================================================================= */}
      {is2FAModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIs2FAModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrcodeOutlined style={{ color: '#38bdf8' }} /> Kích Hoạt Xác Thực 2 Bước (2FA)
              </div>
              <button
                onClick={() => setIs2FAModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                <CloseOutlined />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              1. Dùng ứng dụng <strong>Google Authenticator</strong> hoặc <strong>Microsoft Authenticator</strong> để quét mã QR hoặc nhập khóa thiết lập bên dưới:
            </div>

            {/* Mock QR Code Visual */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: '#ffffff', borderRadius: '14px', width: 'fit-content', margin: '0 auto' }}>
              <div style={{ width: '130px', height: '130px', background: 'radial-gradient(circle, #0284c7 10%, #0f172a 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '32px' }}>
                <QrcodeOutlined />
              </div>
              <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 800, marginTop: '8px', letterSpacing: '1px' }}>
                CARDFLOW-2FA
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Khóa dự phòng (Secret Key):</span>
              <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>{mock2FASecret}</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>2. Nhập mã xác thực 6 chữ số từ điện thoại</label>
              <input
                type="text"
                maxLength={6}
                value={twoFACodeInput}
                onChange={(e) => setTwoFACodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 123456"
                className={styles.inputField}
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 800 }}
                autoFocus
              />
              {twoFAError && (
                <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>
                  {twoFAError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className={styles.ghostBtn} onClick={() => setIs2FAModalOpen(false)}>
                Hủy bỏ
              </button>
              <button className={styles.primaryBtn} onClick={handleVerifyAndEnable2FA}>
                <CheckCircleFilled /> Xác Nhận & Kích Hoạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XÁC NHẬN ĐĂNG XUẤT THIẾT BỊ KHÁC */}
      {/* ========================================================================= */}
      {isRevokeModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRevokeModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogoutOutlined style={{ color: '#ef4444' }} /> Thu Hồi Phiên Các Thiết Bị Khác?
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác không? Các phiên trên điện thoại iPhone và máy tính bảng sẽ bị chấm dứt ngay lập tức.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className={styles.ghostBtn} onClick={() => setIsRevokeModalOpen(false)}>
                Giữ lại
              </button>
              <button
                className={styles.dangerBtn}
                style={{ background: '#dc2626', color: '#ffffff', border: 'none' }}
                onClick={handleRevokeOtherSessions}
              >
                Đăng Xuất Khỏi Tất Cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
