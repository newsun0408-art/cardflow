'use client';

import {
  DeleteOutlined,
  ExclamationCircleFilled,
  CloseOutlined,
  ShopOutlined,
  CreditCardOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { TransactionItem } from '../types';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
  onConfirmDelete: (txId: string) => void;
}

export function DeleteTransactionModal({
  isOpen,
  onClose,
  transaction,
  onConfirmDelete,
}: DeleteTransactionModalProps) {
  if (!isOpen || !transaction) return null;

  const handleConfirm = () => {
    onConfirmDelete(transaction.id);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 30px rgba(239, 68, 68, 0.2)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Đóng"
        >
          <CloseOutlined style={{ fontSize: '12px' }} />
        </button>

        {/* Warning Icon & Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 12px auto',
              borderRadius: '18px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              color: '#ef4444',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
            }}
          >
            <DeleteOutlined />
          </div>

          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
            Xác Nhận Xóa Giao Dịch
          </h3>

          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
            Bạn có chắc chắn muốn xóa giao dịch này khỏi hệ thống không?
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShopOutlined /> Điểm bán / Nội dung
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textAlign: 'right', maxWidth: '200px' }}>
              {transaction.merchant}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Số tiền</span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: transaction.type === 'expense' ? '#f472b6' : '#34d399',
              }}
            >
              {transaction.amount > 0 ? '+' : ''}
              {transaction.amount.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCardOutlined /> Thẻ thanh toán
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
              •••• {transaction.cardLast4}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarOutlined /> Thời gian
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {transaction.dateDisplay || transaction.date} lúc {transaction.time}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Mã GD</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {transaction.referenceId}
            </span>
          </div>
        </div>

        {/* Warning callout */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '11px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '20px',
            lineHeight: '1.4',
          }}
        >
          <ExclamationCircleFilled style={{ color: '#ef4444', fontSize: '14px', marginTop: '1px', flexShrink: 0 }} />
          <span>
            Hành động này sẽ <strong>xóa vĩnh viễn</strong> giao dịch khỏi lịch sử và tự động tính toán lại tổng chi tiêu / hạn mức ngày của thẻ.
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
            }}
          >
            <DeleteOutlined /> Xác Nhận Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
