import type { CardDataModel } from '@/app/_components/AddCardModal';

export interface TransactionItem {
  id: string;
  cardId: string;
  cardLast4: string;
  merchant: string;
  category: 'dining' | 'shopping' | 'transport' | 'tech' | 'salary' | 'refund' | 'housing' | 'investment' | 'education' | 'other';
  categoryLabel: string;
  amount: number;
  type: 'expense' | 'income';
  date: string; // YYYY-MM-DD
  dateDisplay: string;
  time: string;
  status: 'Thành công' | 'Đang xử lý' | 'Thất bại';
  referenceId: string;
  receiptImage?: string; // Data URL hoặc đường dẫn ảnh hóa đơn đã quét / đính kèm
}

export interface CategoryBreakdownItem {
  key: string;
  label: string;
  shortLabel: string;
  amount: number;
  percent: number;
  color: string;
  icon: string;
  budgetLimit: number;
  advice: string;
}

export interface TransactionExpenseManagerProps {
  transactions: TransactionItem[];
  cards: CardDataModel[];
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onAddTransaction: (newTx: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => void;
  onAddBatchTransactions?: (newTxs: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>[]) => void;
  onOpenExportReport: () => void;
  onOpenImportSheet?: () => void;
  onToast: (msg: string) => void;
  activeTab?: 'transactions' | 'stats';
  onSelectTransaction?: (tx: TransactionItem) => void;
  onEditTransaction?: (tx: TransactionItem) => void;
  onDeleteTransaction?: (tx: TransactionItem) => void;
  autoOpenScanner?: boolean;
  onResetAutoOpenScanner?: () => void;
}
