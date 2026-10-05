'use client';

import { useState, useMemo } from 'react';
import {
  ExpenseCharts,
  TransactionFeed,
  AddTransactionModal,
  EditTransactionModal,
  DeleteTransactionModal,
  ExpenseAnalyticsModals,
  ReceiptScannerModal,
  type TransactionItem,
  type CategoryBreakdownItem,
  type TransactionExpenseManagerProps,
  type AddTransactionPrefill,
} from '@/features/transactions';
import styles from './TransactionExpenseManager.module.css';

export type { TransactionItem, CategoryBreakdownItem, TransactionExpenseManagerProps };

export function TransactionExpenseManager({
  transactions,
  cards,
  isBalanceHidden,
  onToggleBalance,
  onAddTransaction,
  onOpenExportReport,
  onOpenImportSheet,
  onToast,
  activeTab = 'transactions',
  onSelectTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionExpenseManagerProps) {
  // Navigation / Date state
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'donut' | 'bar'>('donut');
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [scannedPrefill, setScannedPrefill] = useState<AddTransactionPrefill | null>(null);
  const [txToEdit, setTxToEdit] = useState<TransactionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<TransactionItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryBreakdownItem | null>(null);
  const [hoveredCategoryKey, setHoveredCategoryKey] = useState<string | null>(null);
  const [addTxCategory, setAddTxCategory] = useState<TransactionItem['category']>('dining');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculations for Totals & Categories
  const { totalExpense, totalIncome, categoryBreakdown } = useMemo(() => {
    let expense = 0;
    let income = 0;
    const catMap: Record<string, { label: string; shortLabel: string; amount: number; color: string; icon: string; budgetLimit: number; advice: string }> = {
      tech: {
        label: 'Công nghệ & Mua sắm',
        shortLabel: 'Công nghệ',
        amount: 0,
        color: '#38bdf8',
        icon: '💻',
        budgetLimit: 15000000,
        advice: 'Khoản mua Laptop Pro 12.5Tr là khoản chi lớn nhất. Bạn có thể đăng ký trả góp 0% để giảm áp lực ngân sách.',
      },
      dining: {
        label: 'Ăn uống & Cà phê',
        shortLabel: 'Ăn uống',
        amount: 0,
        color: '#f59e0b',
        icon: '🍔',
        budgetLimit: 6000000,
        advice: 'Chi tiêu ẩm thực đang ở mức tốt (70% ngân sách). Dùng thẻ Techcombank VIP cuối tuần để nhận hoàn tiền 5%.',
      },
      transport: {
        label: 'Di chuyển & Xăng xe',
        shortLabel: 'Di chuyển',
        amount: 0,
        color: '#a855f7',
        icon: '🚗',
        budgetLimit: 3000000,
        advice: 'Khoản chi Grab Car và đi lại đều đặn, không có phát sinh bất thường.',
      },
      housing: {
        label: 'Nhà cửa & Hóa đơn',
        shortLabel: 'Nhà cửa',
        amount: 0,
        color: '#10b981',
        icon: '🏠',
        budgetLimit: 5000000,
        advice: 'Nên cài đặt tự động trích nợ qua thẻ mặc định để tránh quên hạn thanh toán hóa đơn điện thoại / internet.',
      },
      other: {
        label: 'Khác & Dự phòng',
        shortLabel: 'Còn lại',
        amount: 0,
        color: '#94a3b8',
        icon: '🫧',
        budgetLimit: 4000000,
        advice: 'Các chi tiêu lặt vặt nằm trong ngưỡng kiểm soát an toàn.',
      },
    };

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const absVal = Math.abs(tx.amount);
        expense += absVal;
        const key = catMap[tx.category] ? tx.category : 'other';
        const item = catMap[key];
        if (item) {
          item.amount += absVal;
        }
      } else if (tx.type === 'income') {
        income += tx.amount;
      }
    });

    const breakdown: CategoryBreakdownItem[] = Object.entries(catMap).map(([key, data]) => ({
      key,
      label: data.label,
      shortLabel: data.shortLabel,
      amount: data.amount,
      percent: expense > 0 ? Math.round((data.amount / expense) * 100) : 0,
      color: data.color,
      icon: data.icon,
      budgetLimit: data.budgetLimit,
      advice: data.advice,
    }));

    breakdown.sort((a, b) => b.amount - a.amount);
    return { totalExpense: expense, totalIncome: income, categoryBreakdown: breakdown };
  }, [transactions]);

  // Filtered transactions for feed (tìm kiếm + thẻ + danh mục + khoảng ngày)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        searchQuery === '' ||
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.cardLast4.includes(searchQuery);

      const matchCard = selectedCardFilter === 'all' || tx.cardId === selectedCardFilter;
      const matchCat = selectedCategoryFilter === 'all' || tx.category === selectedCategoryFilter;

      const txDate = tx.date;
      const matchStart = !startDate || txDate >= startDate;
      const matchEnd = !endDate || txDate <= endDate;

      return matchSearch && matchCard && matchCat && matchStart && matchEnd;
    });
  }, [transactions, searchQuery, selectedCardFilter, selectedCategoryFilter, startDate, endDate]);

  // Thống kê chi và thu của các giao dịch trong khoảng đã lọc
  const { filteredExpense, filteredIncome } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense') exp += Math.abs(tx.amount);
      else if (tx.type === 'income') inc += tx.amount;
    });
    return { filteredExpense: exp, filteredIncome: inc };
  }, [filteredTransactions]);

  // Transactions belonging to selectedCategoryDetail
  const categoryTransactions = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return transactions.filter((t) => t.category === selectedCategoryDetail.key && t.type === 'expense');
  }, [transactions, selectedCategoryDetail]);

  const chartsComponent = (
    <ExpenseCharts
      totalExpense={totalExpense}
      totalIncome={totalIncome}
      categoryBreakdown={categoryBreakdown}
      isBalanceHidden={isBalanceHidden}
      onToggleBalance={onToggleBalance}
      viewMode={viewMode}
      setViewMode={setViewMode}
      currentMonthIndex={currentMonthIndex}
      setCurrentMonthIndex={setCurrentMonthIndex}
      showCategoryDetails={showCategoryDetails}
      setShowCategoryDetails={setShowCategoryDetails}
      hoveredCategoryKey={hoveredCategoryKey}
      setHoveredCategoryKey={setHoveredCategoryKey}
      setSelectedCategoryDetail={setSelectedCategoryDetail}
      onOpenAddTxModal={() => setIsAddTxModalOpen(true)}
      onOpenExportReport={onOpenExportReport}
      onOpenImportSheet={onOpenImportSheet}
      onOpenAIModal={() => setIsAIModalOpen(true)}
      onOpenTipsModal={() => setIsTipsModalOpen(true)}
      onToast={onToast}
    />
  );

  const feedComponent = (
    <TransactionFeed
      transactions={filteredTransactions}
      cards={cards}
      isBalanceHidden={isBalanceHidden}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedCardFilter={selectedCardFilter}
      setSelectedCardFilter={setSelectedCardFilter}
      selectedCategoryFilter={selectedCategoryFilter}
      setSelectedCategoryFilter={setSelectedCategoryFilter}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      onClearDateFilter={() => {
        setStartDate('');
        setEndDate('');
      }}
      totalAllTransactionsCount={transactions.length}
      filteredExpense={filteredExpense}
      filteredIncome={filteredIncome}
      activeTab={activeTab}
      onOpenAddTxModal={() => {
        setScannedPrefill(null);
        setIsAddTxModalOpen(true);
      }}
      onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
      onOpenExportReport={onOpenExportReport}
      onOpenImportSheet={onOpenImportSheet}
      onSelectTransaction={onSelectTransaction}
      onEditTransaction={(tx) => {
        if (onEditTransaction) onEditTransaction(tx);
        else {
          setTxToEdit(tx);
          setIsEditModalOpen(true);
        }
      }}
      onDeleteTransaction={(tx) => {
        if (onDeleteTransaction) onDeleteTransaction(tx);
        else {
          setTxToDelete(tx);
          setIsDeleteModalOpen(true);
        }
      }}
    />
  );

  return (
    <div className={styles.container}>
      {/* 
        SỰ KHÁC BIỆT HOÀN TOÀN GIỮA 2 TRANG:
        - Tab 'transactions' (Giao dịch): Trang sổ chi tiết giao dịch (Transaction Ledger). Tập trung vào bộ lọc từ ngày X đến ngày Y, tìm kiếm, thẻ, thêm/xuất sao kê. Không có biểu đồ Donut/Cột.
        - Tab 'stats' (Thống kê): Trang phân tích dữ liệu tài chính (Analytics Hub). Tập trung vào Biểu đồ tỷ trọng Donut, Biểu đồ chi tiêu Cột, So sánh tháng, Ngân sách danh mục, AI Insights. Không có danh sách giao dịch dài dòng.
      */}
      {activeTab === 'transactions' ? (
        feedComponent
      ) : (
        chartsComponent
      )}

      {/* 3. Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => {
          setIsAddTxModalOpen(false);
          setScannedPrefill(null);
        }}
        cards={cards}
        onAddTransaction={onAddTransaction}
        onToast={onToast}
        initialCategory={addTxCategory}
        prefillData={scannedPrefill}
        onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
      />

      {/* 4. Analytics Modals */}
      <ExpenseAnalyticsModals
        selectedCategoryDetail={selectedCategoryDetail}
        onCloseCategoryDetail={() => setSelectedCategoryDetail(null)}
        categoryTransactions={categoryTransactions}
        isBalanceHidden={isBalanceHidden}
        onFilterByCategory={(catKey) => {
          setSelectedCategoryFilter(catKey);
          setSelectedCategoryDetail(null);
          onToast(`🔍 Đã lọc danh sách giao dịch theo mục: ${catKey}`);
          const el = document.getElementById('transaction-list-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onAddCategoryExpense={(catKey) => {
          setAddTxCategory(catKey as any);
          setSelectedCategoryDetail(null);
          setIsAddTxModalOpen(true);
        }}
        isAIModalOpen={isAIModalOpen}
        onCloseAIModal={() => setIsAIModalOpen(false)}
        isTipsModalOpen={isTipsModalOpen}
        onCloseTipsModal={() => setIsTipsModalOpen(false)}
      />

      {/* 5. Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTxToEdit(null);
        }}
        transaction={txToEdit}
        cards={cards}
        onSave={(updated) => {
          onEditTransaction?.(updated);
        }}
        onToast={onToast}
      />

      {/* 6. Delete Transaction Modal */}
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTxToDelete(null);
        }}
        transaction={txToDelete}
        onConfirmDelete={() => {
          if (txToDelete && onDeleteTransaction) {
            onDeleteTransaction(txToDelete);
          }
        }}
      />

      {/* 7. OCR AI Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        cards={cards}
        onApplyToForm={(scanned) => {
          setScannedPrefill({
            merchant: scanned.merchant,
            amount: scanned.amount,
            category: scanned.category,
            cardId: scanned.suggestedCardId,
          });
          setAddTxCategory(scanned.category);
          setIsReceiptScannerOpen(false);
          setIsAddTxModalOpen(true);
        }}
        onQuickSaveTransaction={(newTx) => {
          onAddTransaction(newTx);
          setIsReceiptScannerOpen(false);
        }}
        onToast={onToast}
      />
    </div>
  );
}
