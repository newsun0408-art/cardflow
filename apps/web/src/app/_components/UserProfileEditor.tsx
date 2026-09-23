'use client';

import React, { useState, useRef, useTransition, useEffect } from 'react';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CameraOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  WarningFilled,
  LoadingOutlined,
  SaveOutlined,
  UndoOutlined,
  IdcardOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import type { UserProfile } from '@cardflow-app/shared';
import { updateUserProfileAction } from '../actions/user-profile';
import styles from './UserProfileEditor.module.css';

export interface UserProfileEditorProps {
  initialProfile: UserProfile;
  onSaveSuccess?: (updated: UserProfile) => void;
}

export function UserProfileEditor({ initialProfile, onSaveSuccess }: UserProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [nickname, setNickname] = useState(initialProfile.nickname);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [bio, setBio] = useState(initialProfile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string>(initialProfile.avatarUrl ?? '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when initialProfile changes from outside
  useEffect(() => {
    setProfile(initialProfile);
    setFullName(initialProfile.fullName);
    setNickname(initialProfile.nickname);
    setPhone(initialProfile.phone);
    setBio(initialProfile.bio ?? '');
    setAvatarUrl(initialProfile.avatarUrl ?? '');
  }, [initialProfile]);

  // Kiểm tra có thay đổi dữ liệu so với profile hiện tại không
  const isChanged =
    fullName.trim() !== profile.fullName ||
    nickname.trim().replace(/^@/, '') !== profile.nickname ||
    phone.trim().replace(/[\s.-]/g, '') !== profile.phone.replace(/[\s.-]/g, '') ||
    bio.trim() !== (profile.bio ?? '') ||
    avatarUrl !== (profile.avatarUrl ?? '');

  // Lấy ký tự đại diện (Initials) khi không có ảnh
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[parts.length - 2]?.[0] ?? '';
      const second = parts[parts.length - 1]?.[0] ?? '';
      return (first + second).toUpperCase() || 'CF';
    }
    return (parts[0]?.[0] ?? 'CF').toUpperCase();
  };


  // Xử lý chọn ảnh từ máy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Kiểm tra định dạng ảnh
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Tệp được chọn không phải là hình ảnh. Vui lòng chọn tệp PNG, JPG, JPEG hoặc WEBP.');
      return;
    }

    // 2. Kiểm tra dung lượng (tối đa 3MB)
    const MAX_SIZE_MB = 3;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Dung lượng ảnh vượt quá ${MAX_SIZE_MB}MB. Vui lòng chọn ảnh có kích thước nhỏ hơn.`);
      return;
    }

    // 3. Đọc ảnh thành base64 data url để preview ngay lập tức
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setSuccessMessage('Đã chọn ảnh thành công! Nhấn "Lưu thay đổi" để áp dụng ảnh đại diện mới.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Đã xảy ra lỗi khi đọc tệp hình ảnh từ thiết bị của bạn.');
    };
    reader.readAsDataURL(file);

    // Reset value để có thể chọn lại cùng một file nếu cần
    e.target.value = '';
  };

  // Gỡ bỏ ảnh đại diện về mặc định
  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setErrorMessage(null);
    setSuccessMessage('Đã gỡ ảnh đại diện. Nhấn "Lưu thay đổi" để xác nhận.');
  };

  // Khôi phục về thông tin ban đầu
  const handleReset = () => {
    setFullName(profile.fullName);
    setNickname(profile.nickname);
    setPhone(profile.phone);
    setBio(profile.bio ?? '');
    setAvatarUrl(profile.avatarUrl ?? '');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Lưu thông tin cá nhân
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const result = await updateUserProfileAction(profile, {
          fullName,
          nickname,
          phone,
          avatarUrl,
          bio,
        });

        if (!result.success || !result.profile) {
          setErrorMessage(result.error ?? 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
          return;
        }

        // Cập nhật thành công
        setProfile(result.profile);
        setFullName(result.profile.fullName);
        setNickname(result.profile.nickname);
        setPhone(result.profile.phone);
        setBio(result.profile.bio ?? '');
        setAvatarUrl(result.profile.avatarUrl ?? '');
        setSuccessMessage('🎉 Đã cập nhật thông tin cá nhân thành công!');

        // Lưu vào localStorage để duy trì trạng thái phiên cục bộ
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cardflow_user_profile', JSON.stringify(result.profile));
          } catch {
            // Ignore quota issues
          }
        }

        if (onSaveSuccess) {
          onSaveSuccess(result.profile);
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật hồ sơ.');
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <IdcardOutlined style={{ color: '#38bdf8', fontSize: '20px' }} />
            <span>Chỉnh Sửa Hồ Sơ Cá Nhân</span>
          </div>
          <span className={styles.headerBadge}>
            {profile.role ?? 'Thành viên Verified'}
          </span>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <WarningFilled style={{ color: '#f87171', fontSize: '16px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {successMessage && (
          <div className={styles.successBanner} role="status">
            <CheckCircleFilled style={{ color: '#4ade80', fontSize: '16px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* KHU VỰC AVATAR (CHỌN ẢNH TỪ MÁY) */}
        <div className={styles.avatarSection}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div
            className={styles.avatarWrapper}
            onClick={() => fileInputRef.current?.click()}
            title="Nhấp để chọn ảnh từ máy của bạn"
          >
            <div className={styles.avatarInner}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`Avatar của ${fullName}`}
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {getInitials(fullName)}
                </div>
              )}

              {/* Lớp phủ khi rê chuột */}
              <div className={styles.avatarHoverOverlay}>
                <CameraOutlined style={{ fontSize: '20px' }} />
                <span>Đổi ảnh</span>
              </div>
            </div>
          </div>

          <div className={styles.avatarMeta}>
            <div className={styles.avatarTitle}>Ảnh đại diện hồ sơ</div>
            <div className={styles.avatarSubtitle}>
              Chọn tệp hình ảnh từ máy tính hoặc thiết bị của bạn. Hỗ trợ JPG, PNG, WEBP (tối đa 3MB).
            </div>
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                <UploadOutlined />
                <span>Chọn ảnh từ máy</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={handleRemoveAvatar}
                  disabled={isPending}
                  title="Gỡ ảnh đại diện"
                >
                  <DeleteOutlined />
                  <span>Gỡ ảnh</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FORM NHẬP THÔNG TIN CÁ NHÂN */}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {/* 1. Họ và tên */}
            <div className={styles.fieldGroup}>
              <label htmlFor="user-fullname" className={styles.label}>
                <UserOutlined style={{ color: '#38bdf8' }} />
                <span>Họ và tên</span>
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <UserOutlined />
                </span>
                <input
                  id="user-fullname"
                  type="text"
                  className={styles.input}
                  placeholder="Ví dụ: Lê Huỳnh Thuận"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <span className={styles.helpText}>Tên hiển thị trên hồ sơ và thẻ thành viên</span>
            </div>

            {/* 2. Biệt danh (Nickname) */}
            <div className={styles.fieldGroup}>
              <label htmlFor="user-nickname" className={styles.label}>
                <SmileOutlined style={{ color: '#38bdf8' }} />
                <span>Biệt danh (Nickname)</span>
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>@</span>
                <input
                  id="user-nickname"
                  type="text"
                  className={styles.input}
                  placeholder="thuanle.vip"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.replace(/\s+/g, ''))}
                  disabled={isPending}
                  required
                />
              </div>
              <span className={styles.helpText}>Tên định danh tài khoản độc nhất trong hệ thống</span>
            </div>

            {/* 3. Số điện thoại */}
            <div className={styles.fieldGroup}>
              <label htmlFor="user-phone" className={styles.label}>
                <PhoneOutlined style={{ color: '#38bdf8' }} />
                <span>Số điện thoại</span>
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <PhoneOutlined />
                </span>
                <input
                  id="user-phone"
                  type="tel"
                  className={styles.input}
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <span className={styles.helpText}>Dùng để nhận OTP bảo mật và thông báo giao dịch</span>
            </div>

            {/* 4. Email tài khoản */}
            <div className={styles.fieldGroup}>
              <label htmlFor="user-email" className={styles.label}>
                <MailOutlined style={{ color: '#94a3b8' }} />
                <span>Email tài khoản</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <MailOutlined />
                </span>
                <input
                  id="user-email"
                  type="email"
                  className={styles.input}
                  value={profile.email}
                  disabled
                  title="Email được xác thực bởi nhà cung cấp SSO và không thể tự đổi"
                />
              </div>
              <span className={styles.helpText}>Đã xác thực bởi hệ thống Enterprise SSO</span>
            </div>

            {/* 5. Giới thiệu bản thân (Bio) */}
            <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
              <label htmlFor="user-bio" className={styles.label}>
                <span>Giới thiệu bản thân (Tùy chọn)</span>
              </label>
              <textarea
                id="user-bio"
                className={styles.textarea}
                placeholder="Viết một vài dòng ngắn về bạn..."
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isPending}
                maxLength={200}
              />
              <span className={styles.helpText}>Tối đa 200 ký tự</span>
            </div>
          </div>

          {/* HÀNH ĐỘNG: LƯU & HOÀN TÁC */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
              disabled={!isChanged || isPending}
            >
              <UndoOutlined style={{ marginRight: '6px' }} />
              <span>Hoàn tác</span>
            </button>

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={!isChanged || isPending}
            >
              {isPending ? (
                <>
                  <LoadingOutlined />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <SaveOutlined />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
