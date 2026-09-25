'use client';

import {
  CreditCardOutlined,
  BellOutlined,
} from '@ant-design/icons';
import styles from '@/app/_components/AppSettingsHub.module.css';

interface PaymentsTabProps {
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  alertOverLimit80: boolean;
  setAlertOverLimit80: (val: boolean) => void;
  notifyWebPush: boolean;
  setNotifyWebPush: (val: boolean) => void;
  notifyEmail: boolean;
  setNotifyEmail: (val: boolean) => void;
  notifySuspicious: boolean;
  setNotifySuspicious: (val: boolean) => void;
  email: string;
  onToast: (msg: string) => void;
}

export function PaymentsTab({
  isBalanceHidden,
  onToggleBalance,
  alertOverLimit80,
  setAlertOverLimit80,
  notifyWebPush,
  setNotifyWebPush,
  notifyEmail,
  setNotifyEmail,
  notifySuspicious,
  setNotifySuspicious,
  email,
  onToast,
}: PaymentsTabProps) {
  return (
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
              Tự động chuyển số tiền hiển thị thành &apos;•••••••• ₫&apos; trên Dashboard và Danh sách thẻ
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
            <div className={styles.rowItemHint}>Gửi chi tiết hóa đơn điện tử về hộp thư {email}</div>
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
  );
}
