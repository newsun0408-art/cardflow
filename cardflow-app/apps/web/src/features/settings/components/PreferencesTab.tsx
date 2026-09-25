'use client';

import {
  BgColorsOutlined,
} from '@ant-design/icons';
import type { AccentColor } from '../types';
import styles from '@/app/_components/AppSettingsHub.module.css';

interface PreferencesTabProps {
  accentColor: AccentColor;
  setAccentColor: (val: AccentColor) => void;
  parallaxTilt: boolean;
  setParallaxTilt: (val: boolean) => void;
  currency: 'VND' | 'USD';
  setCurrency: (val: 'VND' | 'USD') => void;
  saveSetting: (key: string, val: string) => void;
  onToast: (msg: string) => void;
}

export function PreferencesTab({
  accentColor,
  setAccentColor,
  parallaxTilt,
  setParallaxTilt,
  currency,
  setCurrency,
  saveSetting,
  onToast,
}: PreferencesTabProps) {
  const ACCENT_OPTIONS: { id: AccentColor; label: string; color: string; border: string }[] = [
    { id: 'cyan', label: 'Neon Cyan', color: '#38bdf8', border: '#0284c7' },
    { id: 'gold', label: 'Gold Luxe', color: '#f59e0b', border: '#d97706' },
    { id: 'emerald', label: 'Emerald', color: '#10b981', border: '#059669' },
    { id: 'ruby', label: 'Crimson Ruby', color: '#ef4444', border: '#dc2626' },
  ];

  return (
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
            {ACCENT_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setAccentColor(item.id);
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
              const val = e.target.value as 'VND' | 'USD';
              setCurrency(val);
              saveSetting('cardflow_currency', val);
              onToast(`💵 Đã chuyển đơn vị tiền tệ: ${val}`);
            }}
          >
            <option value="VND">Việt Nam Đồng (₫ - VND)</option>
            <option value="USD">Đô La Mỹ ($ - USD)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
