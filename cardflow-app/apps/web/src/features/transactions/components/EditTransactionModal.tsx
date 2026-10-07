'use client';

import { useState, useEffect } from 'react';
import {
  EditOutlined,
  CloseOutlined,
  SaveOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '../types';
import { formatTransactionDate, getLocalDateString } from '../dateUtils';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
  cards: CardDataModel[];
  onSave: (updatedTx: TransactionItem) => void;
  onToast: (msg: string) => void;
}

// Hàm đọc số tiền thành chữ tiếng Việt
function numberToVietnameseText(amount: number): string {
  if (!amount || amount <= 0) return '';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readTriple(n: number, showZeroHundred: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (h === 0 && t === 0 && u === 0) return '';
    let res = '';
    if (h > 0 || showZeroHundred) {
      res += `${digits[h]} trăm `;
    }
    if (t === 0 && u > 0 && (h > 0 || showZeroHundred)) {
      res += 'lẻ ';
    } else if (t === 1) {
      res += 'mười ';
    } else if (t > 1) {
      res += `${digits[t]} mươi `;
    }
    if (t > 0 && u === 1 && t > 1) {
      res += 'mốt ';
    } else if (t > 0 && u === 5) {
      res += 'lăm ';
    } else if (u > 0) {
      res += `${digits[u]} `;
    }
    return res.trim();
  }

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  let temp = Math.floor(amount);
  const parts: number[] = [];
  while (temp > 0) {
    parts.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }
  if (parts.length === 0) return 'Không đồng';

  let result = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part !== undefined && part > 0) {
      const showZero = i < parts.length - 1;
      const text = readTriple(part, showZero);
      const scale = scales[i] ?? '';
      result += `${text} ${scale} `;
    }
  }
  result = result.trim() + ' đồng';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

const CATEGORY_MAP: Record<TransactionItem['category'], { label: string; icon: string }> = {
  dining: { label: 'Ăn uống', icon: '🍔' },
  tech: { label: 'Công nghệ', icon: '💻' },
  transport: { label: 'Di chuyển', icon: '🚗' },
  shopping: { label: 'Mua sắm', icon: '🛍️' },
  housing: { label: 'Nhà cửa', icon: '🏠' },
  investment: { label: 'Đầu tư', icon: '📈' },
  salary: { label: 'Lương', icon: '💵' },
  refund: { label: 'Hoàn tiền', icon: '💸' },
  education: { label: 'Giáo dục', icon: '🎓' },
  other: { label: 'Khác', icon: '💳' },
};

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  cards,
  onSave,
  onToast,
}: EditTransactionModalProps) {
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txMerchant, setTxMerchant] = useState('');
  const [txCategory, setTxCategory] = useState<TransactionItem['category']>('dining');
  const [txCardId, setTxCardId] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txTime, setTxTime] = useState('');
  const [txStatus, setTxStatus] = useState<TransactionItem['status']>('Thành công');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Synchronize state whenever a transaction is selected
  useEffect(() => {
    if (transaction) {
      setTxType(transaction.type);
      const absAmount = Math.abs(transaction.amount);
      setTxAmount(absAmount > 0 ? `${absAmount.toLocaleString('vi-VN')} VNĐ` : '');
      setTxMerchant(transaction.merchant || '');
      setTxCategory(transaction.category || 'other');
      setTxCardId(transaction.cardId || cards[0]?.id || '');
      setTxDate(transaction.date || new Date().toISOString().slice(0, 10));
      setTxTime(transaction.time || '12:00');
      setTxStatus(transaction.status || 'Thành công');
      setReceiptImage(transaction.receiptImage || null);
    }
  }, [transaction, cards]);

  if (!isOpen || !transaction) return null;

  const currentNumericAmount = parseInt(txAmount.replace(/\D/g, ''), 10) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setTxAmount('');
      return;
    }
    const num = parseInt(raw, 10);
    if (num > 100_000_000_000) return;
    setTxAmount(`${num.toLocaleString('vi-VN')} VNĐ`);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const raw = txAmount.replace(/\D/g, '');
      if (raw.length <= 1) {
        setTxAmount('');
        e.preventDefault();
      } else {
        const sliced = raw.slice(0, -1);
        const num = parseInt(sliced, 10);
        setTxAmount(`${num.toLocaleString('vi-VN')} VNĐ`);
        e.preventDefault();
      }
    }
  };

  const handleQuickAdd = (delta: number) => {
    const next = currentNumericAmount + delta;
    if (next > 100_000_000_000) return;
    setTxAmount(`${next.toLocaleString('vi-VN')} VNĐ`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(txAmount.replace(/\D/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onToast('⚠️ Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }
    if (!txMerchant.trim()) {
      onToast('⚠️ Vui lòng nhập tên điểm bán hoặc nội dung');
      return;
    }

    const selectedCard = cards.find((c) => c.id === txCardId) || cards[0];
    const categoryInfo = CATEGORY_MAP[txCategory] || { label: 'Khác' };

    // Format date display
    const displayDate = formatTransactionDate(txDate);

    const updatedTx: TransactionItem = {
      ...transaction,
      cardId: txCardId || transaction.cardId,
      cardLast4: selectedCard ? selectedCard.lastFourDigits : transaction.cardLast4,
      merchant: txMerchant.trim(),
      category: txCategory,
      categoryLabel: categoryInfo.label,
      amount: txType === 'expense' ? -parsedAmount : parsedAmount,
      type: txType,
      date: txDate,
      dateDisplay: displayDate,
      time: txTime || '12:00',
      status: txStatus,
      receiptImage: receiptImage || undefined,
    };

    onSave(updatedTx);
    onToast(`✏️ Đã cập nhật giao dịch "${txMerchant.trim()}" thành công!`);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EditOutlined style={{ color: '#38bdf8' }} /> Chỉnh Sửa Giao Dịch
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
              Mã GD: <span style={{ color: '#38bdf8' }}>{transaction.referenceId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
            title="Đóng"
          >
            <CloseOutlined />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          {/* 1. Loại giao dịch: Chi tiêu vs Thu nhập */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTxType('expense')}
              style={{
                padding: '9px',
                borderRadius: '10px',
                border: txType === 'expense' ? '1px solid rgba(244, 114, 182, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                background: txType === 'expense' ? 'rgba(236, 72, 153, 0.22)' : 'rgba(255,255,255,0.03)',
                color: txType === 'expense' ? '#f472b6' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              💸 Khoản Chi Tiêu
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              style={{
                padding: '9px',
                borderRadius: '10px',
                border: txType === 'income' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                background: txType === 'income' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.03)',
                color: txType === 'income' ? '#34d399' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              💰 Khoản Thu Nhập
            </button>
          </div>

          {/* 2. Số tiền */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Số tiền ({txType === 'expense' ? 'VNĐ Chi' : 'VNĐ Thu'}) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="VD: 500.000 VNĐ"
              value={txAmount}
              onChange={handleAmountChange}
              onKeyDown={handleAmountKeyDown}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: txType === 'expense' ? '#f472b6' : '#34d399',
                fontSize: '18px',
                fontWeight: 800,
                boxSizing: 'border-box',
                outline: 'none',
                letterSpacing: '0.5px',
              }}
            />

            {/* Đọc tiền thành chữ */}
            {currentNumericAmount > 0 && (
              <div style={{ fontSize: '11px', color: '#38bdf8', fontStyle: 'italic', marginTop: '5px', paddingLeft: '2px', lineHeight: '1.4' }}>
                ✍️ Bằng chữ: <strong>{numberToVietnameseText(currentNumericAmount)}</strong>
              </div>
            )}

            {/* Nút cộng nhanh */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '+1.000.000', delta: 1_000_000 },
                { label: '+5.000.000', delta: 5_000_000 },
                { label: '+20.000.000', delta: 20_000_000 },
              ].map((btn) => (
                <button
                  key={btn.delta}
                  type="button"
                  onClick={() => handleQuickAdd(btn.delta)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {btn.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTxAmount('')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                Xóa
              </button>
            </div>
          </div>

          {/* 3. Tên giao dịch / Đơn vị chấp nhận */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Tên giao dịch / Điểm bán <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Starbucks Coffee, Grab, Tiền phòng..."
              value={txMerchant}
              onChange={(e) => setTxMerchant(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* 4. Danh mục chi tiêu */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Danh mục
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(Object.keys(CATEGORY_MAP) as TransactionItem['category'][]).map((catKey) => {
                const item = CATEGORY_MAP[catKey];
                const isSelected = txCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setTxCategory(catKey)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Thẻ thanh toán */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
              Thẻ ngân hàng thanh toán
            </label>
            <select
              value={txCardId}
              onChange={(e) => setTxCardId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  💳 {c.nickname} (•••• {c.lastFourDigits}) {c.cardCategory ? `[${c.cardCategory}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Ngày, Giờ & Trạng thái */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarOutlined style={{ color: '#38bdf8' }} /> Ngày GD
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setTxDate(getLocalDateString())}
                    style={{
                      padding: '1px 5px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      cursor: 'pointer',
                    }}
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setTxDate(getLocalDateString(d));
                    }}
                    style={{
                      padding: '1px 5px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    Hôm qua
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
              {txDate && (
                <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '3px', fontWeight: 600 }}>
                  Hiển thị: {formatTransactionDate(txDate)}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ClockCircleOutlined style={{ color: '#38bdf8' }} /> Giờ GD
              </label>
              <input
                type="time"
                value={txTime}
                onChange={(e) => setTxTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                Trạng thái
              </label>
              <select
                value={txStatus}
                onChange={(e) => setTxStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 8px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: txStatus === 'Thành công' ? '#34d399' : txStatus === 'Đang xử lý' ? '#f59e0b' : '#f87171',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Thành công">Thành công</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Thất bại">Thất bại</option>
              </select>
            </div>
          </div>

          {/* Ảnh hóa đơn đính kèm (nếu có) */}
          {receiptImage ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={receiptImage}
                  alt="Receipt"
                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>🧾 Ảnh hóa đơn đính kèm</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Đã lưu cùng giao dịch này</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptImage(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Gỡ ảnh
              </button>
            </div>
          ) : (
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <span>📷 Đính kèm ảnh hóa đơn mới</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () => setReceiptImage(r.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                />
              </label>
            </div>
          )}

          {/* Buttons: Hủy & Lưu Thay Đổi */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
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
              type="submit"
              style={{
                flex: 2,
                padding: '11px 0',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)',
              }}
            >
              <SaveOutlined /> Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
