'use client';

import { useState, useEffect } from 'react';
import {
  FileAddOutlined,
  CheckCircleFilled,
  CloseOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '../types';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

export interface AddTransactionPrefill {
  merchant?: string;
  amount?: number;
  category?: TransactionItem['category'];
  cardId?: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardDataModel[];
  onAddTransaction: (newTx: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => void;
  onToast: (msg: string) => void;
  initialCategory?: TransactionItem['category'];
  prefillData?: AddTransactionPrefill | null;
  onOpenReceiptScanner?: () => void;
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

export function AddTransactionModal({
  isOpen,
  onClose,
  cards,
  onAddTransaction,
  onToast,
  initialCategory = 'dining',
  prefillData,
  onOpenReceiptScanner,
}: AddTransactionModalProps) {
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txMerchant, setTxMerchant] = useState('');
  const [txCategory, setTxCategory] = useState<TransactionItem['category']>(initialCategory);
  const [txCardId, setTxCardId] = useState(cards[0]?.id || 'card-1');

  // Tự động điền dữ liệu khi người dùng quét hóa đơn thành công
  useEffect(() => {
    if (prefillData) {
      if (prefillData.merchant) setTxMerchant(prefillData.merchant);
      if (prefillData.amount && prefillData.amount > 0) {
        setTxAmount(`${prefillData.amount.toLocaleString('vi-VN')} VNĐ`);
      }
      if (prefillData.category) setTxCategory(prefillData.category);
      if (prefillData.cardId) setTxCardId(prefillData.cardId);
    }
  }, [prefillData]);

  if (!isOpen) return null;

  // Lấy giá trị số nguyên từ chuỗi định dạng (ví dụ: '20.000.000 VNĐ' -> 20000000)
  const currentNumericAmount = parseInt(txAmount.replace(/\D/g, ''), 10) || 0;

  // Xử lý khi gõ bàn phím ô số tiền: tự động định dạng như 20.000.000 VNĐ
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setTxAmount('');
      return;
    }
    const num = parseInt(raw, 10);
    if (num > 100_000_000_000) return; // Giới hạn an toàn
    setTxAmount(`${num.toLocaleString('vi-VN')} VNĐ`);
  };

  // Hỗ trợ xóa lùi từng chữ số khi người dùng bấm Backspace
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

  // Thêm nhanh số tiền định sẵn
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

        {/* Nút Gọi Quét Hóa Đơn AI */}
        {onOpenReceiptScanner && (
          <button
            type="button"
            onClick={onOpenReceiptScanner}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)',
              transition: 'all 0.2s',
            }}
          >
            <ScanOutlined style={{ fontSize: '16px' }} />
            <span>Quét Hóa Đơn Bằng AI (Tự động điền)</span>
          </button>
        )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.formLabel}>Số tiền (VNĐ)</label>
              {currentNumericAmount > 0 && (
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                  Tự động định dạng: VNĐ
                </span>
              )}
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="20.000.000 VNĐ"
                value={txAmount}
                onChange={handleAmountChange}
                onKeyDown={handleAmountKeyDown}
                className={styles.inputField}
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: txType === 'expense' ? '#f472b6' : '#34d399',
                }}
                required
              />
            </div>

            {/* Đọc thành chữ tiếng Việt */}
            {currentNumericAmount > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  marginTop: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontStyle: 'italic',
                }}
              >
                💬 <strong>Bằng chữ:</strong> {numberToVietnameseText(currentNumericAmount)}
              </div>
            )}

            {/* Phím tắt cộng nhanh số tiền */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickAdd(100000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +100K
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(500000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +500K
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1000000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +1.000.000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5000000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +5.000.000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(20000000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +20.000.000
              </button>
              {currentNumericAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setTxAmount('')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tên điểm bán / Nội dung</label>
            <input
              type="text"
              placeholder="Highlands Coffee Landmark"
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
              {cards.map((c) => {
                const purposePrefix = c.purposeIcon ? `${c.purposeIcon} ` : '';
                const purposeSuffix = c.purposeLabel ? ` [${c.purposeLabel}]` : '';
                return (
                  <option key={c.id} value={c.id}>
                    {purposePrefix}{c.bankName} - {c.nickname}{purposeSuffix} (•••• {c.lastFourDigits})
                  </option>
                );
              })}
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
