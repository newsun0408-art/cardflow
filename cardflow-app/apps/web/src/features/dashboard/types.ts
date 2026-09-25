import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { TransactionItem } from '@/features/transactions';

export type DashboardTab = 'overview' | 'cards' | 'transactions' | 'stats' | 'settings';
export type CardsViewMode = 'grid' | 'table' | 'list';

export type { CardDataModel, TransactionItem };
