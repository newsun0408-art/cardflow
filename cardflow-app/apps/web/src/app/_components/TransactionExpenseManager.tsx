'use client';

import { useState, useMemo } from 'react';
import {
  ExpenseCharts,
  TransactionFeed,
  AddTransactionModal,
  ExpenseAnalyticsModals,
  type TransactionItem,
  type CategoryBreakdownItem,
  type TransactionExpenseManagerProps,
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
}: TransactionExpenseManagerProps) {
  // Navigation / Date state
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'donut' | 'bar'>('donut');
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryBreakdownItem | null>(null);
  const [hoveredCategoryKey, setHoveredCategoryKey] = useState<string | null>(null);
  const [addTxCategory, setAddTxCategory] = useState<TransactionItem['category']>('dining');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

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

  // Filtered transactions for feed
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        searchQuery === '' ||
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.cardLast4.includes(searchQuery);

      const matchCard = selectedCardFilter === 'all' || tx.cardId === selectedCardFilter;
      const matchCat = selectedCategoryFilter === 'all' || tx.category === selectedCategoryFilter;

      return matchSearch && matchCard && matchCat;
    });
  }, [transactions, searchQuery, selectedCardFilter, selectedCategoryFilter]);

  // Transactions belonging to selectedCategoryDetail
  const categoryTransactions = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return transactions.filter((t) => t.category === selectedCategoryDetail.key && t.type === 'expense');
  }, [transactions, selectedCategoryDetail]);

  return (
    <div className={styles.container}>
      {/* 1. Quick Actions & Charts */}
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

      {/* 2. Transaction Feed */}
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
      />

      {/* 3. Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        cards={cards}
        onAddTransaction={onAddTransaction}
        onToast={onToast}
        initialCategory={addTxCategory}
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
    </div>
  );
}
