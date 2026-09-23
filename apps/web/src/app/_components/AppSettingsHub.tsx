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
  CloseOutlined
} from '@ant-design/icons';
import type { UserProfile } from '@cardflow-app/shared';
import { UserProfileEditor } from './UserProfileEditor';
import styles from './AppSettingsHub.module.css';

export interface AppSettingsHubProps {
  userProfile: UserProfile;
  onProfileSave: (updated: UserProfile) => void;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onToast: (msg: string) => void;
}

export type SettingsSubTab = 'profile' | 'security' | 'payments' | 'preferences' | 'sessions';

export function AppSettingsHub({
  userProfile,
  onProfileSave,
  isBalanceHidden,
  onToggleBalance,
  onToast,
}: AppSettingsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('security');

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
