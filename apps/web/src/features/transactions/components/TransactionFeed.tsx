'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  SearchOutlined,
  CoffeeOutlined,
  LaptopOutlined,
  CarOutlined,
  ShoppingOutlined,
  CheckCircleFilled,
  HomeOutlined,
  FundProjectionScreenOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  FileExcelOutlined,
  EditOutlined,
  DeleteOutlined,
  ScanOutlined,
  CloseOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
} from '@ant-design/icons';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '../types';
import { formatTransactionDate } from '../dateUtils';
import styles from '@/app/_components/TransactionExpenseManager.module.css';

interface TransactionFeedProps {
  transactions: TransactionItem[];
  cards: CardDataModel[];
  isBalanceHidden: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCardFilter: string;
  setSelectedCardFilter: (val: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (val: string) => void;
  startDate?: string;
  setStartDate?: (val: string) => void;
  endDate?: string;
  setEndDate?: (val: string) => void;
  onClearDateFilter?: () => void;
  totalAllTransactionsCount?: number;
  filteredExpense?: number;
  filteredIncome?: number;
  activeTab?: 'transactions' | 'stats';
  onOpenAddTxModal?: () => void;
  onOpenReceiptScanner?: () => void;
  onOpenExportReport?: () => void;
  onOpenImportSheet?: () => void;
  onSelectTransaction?: (tx: TransactionItem) => void;
  onEditTransaction?: (tx: TransactionItem) => void;
  onDeleteTransaction?: (tx: TransactionItem) => void;
}

export function TransactionFeed({
  transactions,
  cards,
  isBalanceHidden,
  searchQuery,
  setSearchQuery,
  selectedCardFilter,
  setSelectedCardFilter,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  startDate = '',
  setStartDate,
  endDate = '',
  setEndDate,
  onClearDateFilter,
  totalAllTransactionsCount,
  filteredExpense = 0,
  filteredIncome = 0,
  activeTab: _activeTab = 'transactions',
  onOpenAddTxModal,
  onOpenReceiptScanner,
  onOpenExportReport,
  onOpenImportSheet: _onOpenImportSheet,
  onSelectTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionFeedProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6); // Mặc định 6 giao dịch/trang để vừa khít giao diện web

  // Tự động chuyển về trang 1 khi người dùng đổi bộ lọc tìm kiếm / thẻ / danh mục / ngày
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCardFilter, selectedCategoryFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('transaction-list-section');
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 80) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage, pageSize]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handlePreset = (preset: 'all' | 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      setStartDate?.('');
      setEndDate?.('');
    } else if (preset === 'today') {
      const s = toDateStr(today);
      setStartDate?.(s);
      setEndDate?.(s);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate?.(toDateStr(past));
      setEndDate?.(toDateStr(today));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate?.(toDateStr(past));
      setEndDate?.(toDateStr(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate?.(toDateStr(firstDay));
      setEndDate?.(toDateStr(lastDay));
    }
  };

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className={styles.cardBox} id="transaction-list-section">
      {/* 1. Header tinh gọn, thoáng đãng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Lịch Sử Giao Dịch
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              {transactions.length}
              {totalAllTransactionsCount && totalAllTransactionsCount !== transactions.length
                ? ` / ${totalAllTransactionsCount}`
                : ''}{' '}
              giao dịch
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>
              Chi: <strong style={{ color: '#f472b6' }}>{isBalanceHidden ? '•••• ₫' : `-${filteredExpense.toLocaleString('vi-VN')} ₫`}</strong>
            </span>
            <span>•</span>
            <span>
              Thu: <strong style={{ color: '#34d399' }}>{isBalanceHidden ? '•••• ₫' : `+${filteredIncome.toLocaleString('vi-VN')} ₫`}</strong>
            </span>
            {hasDateFilter && (
              <>
                <span>•</span>
                <span style={{ color: '#38bdf8' }}>
                  Khoảng ngày: {startDate ? formatDateDisplay(startDate) : 'đầu'} ➔ {endDate ? formatDateDisplay(endDate) : 'nay'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Nút hành động chính */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenReceiptScanner && (
            <button
              type="button"
              onClick={onOpenReceiptScanner}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(2, 132, 199, 0.28) 100%)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.18)',
                transition: 'all 0.2s',
              }}
            >
              <ScanOutlined /> Quét Lịch Sử Giao Dịch (Ảnh / Chụp)
            </button>
          )}

          {onOpenAddTxModal && (
            <button
              type="button"
              onClick={onOpenAddTxModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)',
              }}
            >
              <PlusOutlined /> Thêm giao dịch
            </button>
          )}

          {onOpenExportReport && (
            <button
              type="button"
              onClick={onOpenExportReport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <FileExcelOutlined /> Xuất sao kê
            </button>
          )}
        </div>
      </div>

      {/* 2. THANH BỘ LỌC DUY NHẤT: Gọn gàng trên cùng 1 hàng */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Tìm kiếm */}
        <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: 'rgba(30, 41, 59, 0.6)', padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <SearchOutlined style={{ color: '#64748b', marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch, điểm bán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', width: '100%' }}
          />
        </div>

        {/* Lọc theo Thẻ */}
        <select
          value={selectedCardFilter}
          onChange={(e) => setSelectedCardFilter(e.target.value)}
          style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '7px 12px', borderRadius: '10px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">Tất cả các thẻ</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nickname} (•••• {c.lastFourDigits})
            </option>
          ))}
        </select>

        {/* Lọc theo Danh mục */}
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '7px 12px', borderRadius: '10px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">Tất cả danh mục</option>
          <option value="dining">🍔 Ăn uống</option>
          <option value="tech">💻 Công nghệ</option>
          <option value="transport">🚗 Di chuyển</option>
          <option value="housing">🏠 Nhà cửa</option>
          <option value="refund">💸 Hoàn tiền</option>
        </select>

        {/* Lọc ngày tinh gọn (Từ - Đến) */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.6)', padding: '5px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CalendarOutlined style={{ color: '#38bdf8', fontSize: '13px' }} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate?.(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
            title="Từ ngày"
          />
          <span style={{ color: '#64748b', fontSize: '11px' }}>➔</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate?.(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
            title="Đến ngày"
          />
          {hasDateFilter && (
            <button
              type="button"
              onClick={() => {
                if (onClearDateFilter) onClearDateFilter();
                else {
                  setStartDate?.('');
                  setEndDate?.('');
                }
              }}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
              title="Xóa lọc ngày"
            >
              <CloseCircleOutlined style={{ fontSize: '13px' }} />
            </button>
          )}
        </div>

        {/* Nút chọn nhanh thời gian */}
        <select
          onChange={(e) => handlePreset(e.target.value as any)}
          value={!hasDateFilter ? 'all' : ''}
          style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '7px 10px', borderRadius: '10px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="" disabled hidden>Thời gian</option>
          <option value="all">Toàn bộ thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="thisMonth">Tháng này</option>
        </select>
      </div>

      {/* Transaction Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {paginatedTransactions.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectTransaction?.(tx)}
            title="Nhấp để xem chi tiết giao dịch"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s',
              cursor: onSelectTransaction ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (onSelectTransaction) {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (onSelectTransaction) {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: tx.type === 'expense' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: tx.type === 'expense' ? '#f472b6' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {tx.category === 'dining' && <CoffeeOutlined />}
                {tx.category === 'tech' && <LaptopOutlined />}
                {tx.category === 'transport' && <CarOutlined />}
                {tx.category === 'shopping' && <ShoppingOutlined />}
                {tx.category === 'refund' && <CheckCircleFilled />}
                {tx.category === 'housing' && <HomeOutlined />}
                {tx.category === 'investment' && <FundProjectionScreenOutlined />}
                {!['dining', 'tech', 'transport', 'shopping', 'refund', 'housing', 'investment'].includes(tx.category) && (
                  <CreditCardOutlined />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{tx.merchant}</span>
                  {tx.receiptImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage(tx.receiptImage!);
                      }}
                      title="Xem ảnh hóa đơn scan"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.28)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                      }}
                    >
                      <img
                        src={tx.receiptImage}
                        alt="Receipt"
                        style={{ width: '13px', height: '13px', borderRadius: '2px', objectFit: 'cover' }}
                      />
                      <span>🧾 Hóa đơn</span>
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {formatTransactionDate(tx.date, tx.dateDisplay)} • {tx.time} • <span style={{ fontFamily: 'monospace' }}>Thẻ •••• {tx.cardLast4}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: tx.type === 'expense' ? '#f472b6' : '#34d399',
                  }}
                >
                  {isBalanceHidden
                    ? '•••••••• ₫'
                    : `${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString('vi-VN')} ₫`}
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                  {tx.status}
                </div>
              </div>

              {(onEditTransaction || onDeleteTransaction) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    paddingLeft: '10px',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEditTransaction && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(tx);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Chỉnh sửa thông tin giao dịch"
                    >
                      <EditOutlined style={{ fontSize: '13px' }} />
                    </button>
                  )}

                  {onDeleteTransaction && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTransaction(tx);
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Xóa giao dịch này"
                    >
                      <DeleteOutlined style={{ fontSize: '13px' }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: '13px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <FieldTimeOutlined style={{ fontSize: '32px', color: '#64748b', marginBottom: '10px', display: 'block' }} />
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
              Không tìm thấy giao dịch nào phù hợp
            </div>
            <div>
              {hasDateFilter ? 'Không có giao dịch nào trong khoảng ngày đã chọn.' : 'Không có giao dịch nào khớp với tiêu chí tìm kiếm.'}
            </div>
            {(hasDateFilter || searchQuery || selectedCardFilter !== 'all' || selectedCategoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCardFilter('all');
                  setSelectedCategoryFilter('all');
                  setStartDate?.('');
                  setEndDate?.('');
                }}
                style={{
                  marginTop: '12px',
                  padding: '6px 16px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đặt lại tất cả bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION BAR) */}
      {transactions.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Thông tin hiển thị */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
            <span>
              Hiển thị{' '}
              <strong style={{ color: '#f8fafc' }}>
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, transactions.length)}
              </strong>{' '}
              trong tổng số <strong style={{ color: '#38bdf8' }}>{transactions.length}</strong> giao dịch
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <span style={{ color: '#38bdf8', fontSize: '12px', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              Trang {currentPage} / {totalPages}
            </span>
          </div>

          {/* Cụm nút chuyển trang & chọn số lượng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Dropdown chọn số lượng mỗi trang */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={5}>5 / trang</option>
                <option value={6}>6 / trang (Vừa màn hình)</option>
                <option value={8}>8 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={15}>15 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>

            {/* Nút Về Trang Đầu << */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
              title="Về trang đầu tiên"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: currentPage === 1 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid',
                borderColor: currentPage === 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: currentPage === 1 ? '#475569' : '#cbd5e1',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.color = '#38bdf8';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
            >
              <DoubleLeftOutlined />
            </button>

            {/* Nút Trang Trước < */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              title="Trang trước"
              style={{
                padding: '0 12px',
                height: '32px',
                borderRadius: '8px',
                background: currentPage === 1 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid',
                borderColor: currentPage === 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: currentPage === 1 ? '#475569' : '#e2e8f0',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.color = '#38bdf8';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
            >
              <LeftOutlined style={{ fontSize: '10px' }} /> Trước
            </button>

            {/* Các số trang: [1, 2, 3...] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;

                  return (
                    <div key={page} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {showEllipsis && (
                        <span style={{ color: '#64748b', padding: '0 4px', fontSize: '12px' }}>...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        style={{
                          minWidth: '32px',
                          height: '32px',
                          padding: '0 8px',
                          borderRadius: '8px',
                          background:
                            currentPage === page
                              ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
                              : 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid',
                          borderColor:
                            currentPage === page ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                          color: currentPage === page ? '#ffffff' : '#cbd5e1',
                          fontWeight: currentPage === page ? 800 : 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow:
                            currentPage === page
                              ? '0 0 12px rgba(56, 189, 248, 0.4)'
                              : 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== page) {
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                            e.currentTarget.style.color = '#38bdf8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== page) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = '#cbd5e1';
                          }
                        }}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Nút Trang Kế > */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              title="Trang tiếp theo"
              style={{
                padding: '0 12px',
                height: '32px',
                borderRadius: '8px',
                background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.03)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid',
                borderColor: currentPage === totalPages ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: currentPage === totalPages ? '#475569' : '#e2e8f0',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.color = '#38bdf8';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
            >
              Sau <RightOutlined style={{ fontSize: '10px' }} />
            </button>

            {/* Nút Đến Trang Cuối >> */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              title="Đến trang cuối cùng"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.03)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid',
                borderColor: currentPage === totalPages ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: currentPage === totalPages ? '#475569' : '#cbd5e1',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.color = '#38bdf8';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
            >
              <DoubleRightOutlined />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal for Receipt */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 20, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>🧾 Hóa Đơn / Chứng Từ Giao Dịch</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                  Ảnh scan gốc
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={lightboxImage}
                  download="cardflow-receipt.jpg"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <DownloadOutlined /> Tải về máy
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CloseOutlined /> Đóng
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', borderRadius: '12px', padding: '12px', overflow: 'hidden' }}>
              <img
                src={lightboxImage}
                alt="Ảnh hóa đơn chi tiết"
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  borderRadius: '8px',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
