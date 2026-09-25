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
  onOpenExportReport: () => void;
  onToast: (msg: string) => void;
}
