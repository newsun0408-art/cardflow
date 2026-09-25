'use client';

import { useState } from 'react';
import {
  FileAddOutlined,
  CheckCircleFilled,
  CloseOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '../types';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardDataModel[];
  onAddTransaction: (newTx: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => void;
  onToast: (msg: string) => void;
  initialCategory?: TransactionItem['category'];
}

export function AddTransactionModal({
  isOpen,
  onClose,
  cards,
  onAddTransaction,
  onToast,
  initialCategory = 'dining',
}: AddTransactionModalProps) {
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txMerchant, setTxMerchant] = useState('');
  const [txCategory, setTxCategory] = useState<TransactionItem['category']>(initialCategory);
  const [txCardId, setTxCardId] = useState(cards[0]?.id || 'card-1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(txAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onToast('⚠️ Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }
    if (!txMerchant.trim()) {
      onToast('⚠️ Vui lòng nhập tên điểm bán hoặc nội dung');
      return;
    }

    const card = cards.find((c) => c.id === txCardId) || cards[0];
    const categoryLabels: Record<TransactionItem['category'], string> = {
      dining: 'Ăn uống',
      shopping: 'Mua sắm',
      transport: 'Di chuyển',
      tech: 'Công nghệ',
      salary: 'Lương',
      refund: 'Hoàn tiền',
      housing: 'Nhà cửa',
      investment: 'Đầu tư',
      education: 'Giáo dục',
      other: 'Khác',
    };

    onAddTransaction({
      cardId: txCardId,
      cardLast4: card ? card.lastFourDigits : '9921',
      merchant: txMerchant.trim(),
      category: txCategory,
      categoryLabel: categoryLabels[txCategory] || 'Khác',
      amount: txType === 'expense' ? -parsedAmount : parsedAmount,
      type: txType,
      date: new Date().toISOString().slice(0, 10),
      dateDisplay: 'Hôm nay',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });

    onToast(`✅ Đã ghi nhận giao dịch: ${txMerchant.trim()} (${txType === 'expense' ? '-' : '+'}${parsedAmount.toLocaleString('vi-VN')} ₫)`);
    setTxAmount('');
    setTxMerchant('');
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileAddOutlined style={{ color: '#38bdf8' }} /> Nhập Giao Dịch Mới
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
          >
            <CloseOutlined />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTxType('expense')}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: 'none',
                background: txType === 'expense' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                color: txType === 'expense' ? '#f472b6' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🔴 Khoản Chi Tiêu
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: 'none',
                background: txType === 'income' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                color: txType === 'income' ? '#34d399' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🟢 Khoản Thu Nhập
            </button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Số tiền (VNĐ)</label>
            <input
              type="text"
              placeholder="Ví dụ: 150000"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value.replace(/\D/g, ''))}
              className={styles.inputField}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tên điểm bán / Nội dung</label>
            <input
              type="text"
              placeholder="Ví dụ: Highlands Coffee Landmark"
              value={txMerchant}
              onChange={(e) => setTxMerchant(e.target.value)}
              className={styles.inputField}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phân loại danh mục</label>
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value as any)}
              className={styles.inputField}
              style={{ cursor: 'pointer' }}
            >
              <option value="dining">🍔 Ăn uống & Cà phê</option>
              <option value="tech">💻 Công nghệ & Thiết bị</option>
              <option value="shopping">🛍️ Mua sắm siêu thị</option>
              <option value="transport">🚗 Di chuyển / Xăng xe</option>
              <option value="housing">🏠 Nhà cửa & Tiện ích</option>
              <option value="investment">📈 Đầu tư & Tiết kiệm</option>
              <option value="other">🫧 Khác</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Thẻ thanh toán sử dụng</label>
            <select
              value={txCardId}
              onChange={(e) => setTxCardId(e.target.value)}
              className={styles.inputField}
              style={{ cursor: 'pointer' }}
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bankName} - {c.nickname} (•••• {c.lastFourDigits})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className={styles.ghostBtn} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={styles.primaryBtn}>
              <CheckCircleFilled /> Ghi Nhận Ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
