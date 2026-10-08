'use client';

import { useState } from 'react';
import {
  LaptopOutlined,
  MobileOutlined,
  TabletOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { DeviceSession } from '../types';
import styles from '@/app/_components/AppSettingsHub.module.css';

interface SessionsTabProps {
  sessions: DeviceSession[];
  setSessions: React.Dispatch<React.SetStateAction<DeviceSession[]>>;
  onToast: (msg: string) => void;
}

export function SessionsTab({
  sessions,
  setSessions,
  onToast,
}: SessionsTabProps) {
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setIsRevokeModalOpen(false);
    onToast('🔒 Đã đăng xuất khỏi tất cả các thiết bị khác thành công');
  };

  return (
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

      {/* Modal Xác nhận Đăng xuất thiết bị khác */}
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
