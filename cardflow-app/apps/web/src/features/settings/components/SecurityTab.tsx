'use client';

import { useState } from 'react';
import {
  SafetyCertificateOutlined,
  KeyOutlined,
  CheckCircleFilled,
  QrcodeOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import styles from '@/app/_components/AppSettingsHub.module.css';

interface SecurityTabProps {
  is2FAEnabled: boolean;
  setIs2FAEnabled: (val: boolean) => void;
  isBiometricsEnabled: boolean;
  setIsBiometricsEnabled: (val: boolean) => void;
  autoLockTimeout: string;
  setAutoLockTimeout: (val: string) => void;
  isAutoMaskEnabled: boolean;
  setIsAutoMaskEnabled: (val: boolean) => void;
  saveSetting: (key: string, val: string) => void;
  onToast: (msg: string) => void;
}

export function SecurityTab({
  is2FAEnabled,
  setIs2FAEnabled,
  isBiometricsEnabled,
  setIsBiometricsEnabled,
  autoLockTimeout,
  setAutoLockTimeout,
  isAutoMaskEnabled,
  setIsAutoMaskEnabled,
  saveSetting,
  onToast,
}: SecurityTabProps) {
  // 2FA Modal state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFACodeInput, setTwoFACodeInput] = useState('');
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const mock2FASecret = 'CARDFLOW-8841-SEC-2FA';

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleToggle2FA = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setIs2FAModalOpen(true);
    } else {
      setIs2FAEnabled(false);
      saveSetting('cardflow_2fa_enabled', 'false');
      onToast('🔒 Đã tắt xác thực 2 bước 2FA');
    }
  };

  const handleVerifyAndEnable2FA = () => {
    if (twoFACodeInput.length !== 6) {
      setTwoFAError('Vui lòng nhập đủ 6 chữ số mã xác thực từ app Authenticator');
      return;
    }
    setIs2FAEnabled(true);
    saveSetting('cardflow_2fa_enabled', 'true');
    setIs2FAModalOpen(false);
    setTwoFACodeInput('');
    setTwoFAError(null);
    onToast('🛡️ Đã kích hoạt xác thực hai yếu tố (2FA) bảo mật thành công!');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!currentPin) {
      setPinError('Vui lòng nhập mã PIN hiện tại');
      return;
    }
    if (newPin.length < 4) {
      setPinError('Mã PIN mới phải có ít nhất 4 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Mã PIN mới và xác nhận mã PIN không khớp nhau');
      return;
    }

    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    onToast('🔑 Đã cập nhật mã PIN bảo mật ứng dụng thành công!');
  };

  return (
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

      {/* Modal Kích hoạt 2FA */}
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
    </div>
  );
}
