import React, { createContext, useContext, useState } from 'react';

export interface MobileCard {
  id: string;
  nickname: string;
  bankName: string;
  cardType: string;
  lastFourDigits: string;
  cardNumberFormatted: string;
  holderName: string;
  expiryDate: string;
  cvv: string;
  balance: number;
  dailyLimit: number;
  spentToday: number;
  statementDate: number; // Ngày chốt sao kê trong tháng (vd: 20)
  dueDate: number;       // Ngày đến hạn thanh toán (vd: 5)
  isLocked: boolean;
  onlinePayment: boolean;
  internationalPayment: boolean;
  atmWithdrawal: boolean;
  themeColors: [string, string];
  purposeLabel: string;
  purposeIcon: string;
}

export interface MobileTransaction {
  id: string;
  cardId: string;
  cardName: string;
  merchant: string;
  category: string;
  categoryLabel: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  time: string;
  note?: string;
  icon: string;
  color: string;
}

interface CardflowContextType {
  cards: MobileCard[];
  transactions: MobileTransaction[];
  activeCardId: string;
  setActiveCardId: (id: string) => void;
  addCard: (card: Omit<MobileCard, 'id' | 'spentToday' | 'isLocked'>) => void;
  updateCardLimit: (cardId: string, newLimit: number) => void;
  toggleCardLock: (cardId: string) => void;
  toggleCardSetting: (cardId: string, setting: 'onlinePayment' | 'internationalPayment' | 'atmWithdrawal') => void;
  addTransaction: (tx: Omit<MobileTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  totalLimit: number;
  totalSpent: number;
  totalAvailable: number;
}

const INITIAL_CARDS: MobileCard[] = [
  {
    id: 'card-1',
    nickname: 'Thẻ Công Nghệ & Tiện Ích',
    bankName: 'Techcombank',
    cardType: 'VISA PLATINUM',
    lastFourDigits: '9921',
    cardNumberFormatted: '•••• •••• •••• 9921',
    holderName: 'LÊ HUỲNH THUẬN',
    expiryDate: '09/30',
    cvv: '829',
    balance: 35750000,
    dailyLimit: 50000000,
    spentToday: 14250000,
    statementDate: 20,
    dueDate: 5,
    isLocked: false,
    onlinePayment: true,
    internationalPayment: true,
    atmWithdrawal: true,
    themeColors: ['#0f172a', '#1e293b'],
    purposeLabel: 'Công nghệ & Thiết bị',
    purposeIcon: 'laptop-outline',
  },
  {
    id: 'card-2',
    nickname: 'Thẻ Ăn Uống & Cafe',
    bankName: 'Vietcombank',
    cardType: 'VISA GOLD',
    lastFourDigits: '4412',
    cardNumberFormatted: '•••• •••• •••• 4412',
    holderName: 'LÊ HUỲNH THUẬN',
    expiryDate: '12/28',
    cvv: '351',
    balance: 16500000,
    dailyLimit: 20000000,
    spentToday: 3500000,
    statementDate: 25,
    dueDate: 10,
    isLocked: false,
    onlinePayment: true,
    internationalPayment: false,
    atmWithdrawal: true,
    themeColors: ['#7c2d12', '#ea580c'],
    purposeLabel: 'Ăn uống & Cà phê',
    purposeIcon: 'restaurant-outline',
  },
  {
    id: 'card-3',
    nickname: 'Thẻ Mua Sắm & Siêu Thị',
    bankName: 'MB Bank',
    cardType: 'MASTERCARD PRIORITY',
    lastFourDigits: '8834',
    cardNumberFormatted: '•••• •••• •••• 8834',
    holderName: 'LÊ HUỲNH THUẬN',
    expiryDate: '05/29',
    cvv: '440',
    balance: 15000000,
    dailyLimit: 15000000,
    spentToday: 0,
    statementDate: 15,
    dueDate: 30,
    isLocked: false,
    onlinePayment: true,
    internationalPayment: true,
    atmWithdrawal: true,
    themeColors: ['#1e1b4b', '#4338ca'],
    purposeLabel: 'Mua sắm & Shopping',
    purposeIcon: 'cart-outline',
  },
];

const INITIAL_TRANSACTIONS: MobileTransaction[] = [
  {
    id: 'tx-1',
    cardId: 'card-1',
    cardName: 'Techcombank (9921)',
    merchant: 'Tiệm Trà Xinh',
    category: 'dining',
    categoryLabel: 'Ăn uống',
    amount: 100000,
    type: 'expense',
    date: 'Hôm nay',
    time: '15:32',
    note: 'Trà sen vàng & bánh ngọt',
    icon: 'cafe-outline',
    color: '#f59e0b',
  },
  {
    id: 'tx-2',
    cardId: 'card-2',
    cardName: 'Vietcombank (4412)',
    merchant: 'WinMart Thảo Điền',
    category: 'shopping',
    categoryLabel: 'Mua sắm',
    amount: 485000,
    type: 'expense',
    date: 'Hôm nay',
    time: '11:15',
    note: 'Mua thực phẩm tuần',
    icon: 'cart-outline',
    color: '#ec4899',
  },
  {
    id: 'tx-3',
    cardId: 'card-3',
    cardName: 'MB Bank (8834)',
    merchant: 'Petrolimex Cây Xăng 01',
    category: 'transport',
    categoryLabel: 'Di chuyển',
    amount: 500000,
    type: 'expense',
    date: 'Hôm qua',
    time: '08:20',
    note: 'Đổ xăng ô tô',
    icon: 'car-outline',
    color: '#38bdf8',
  },
  {
    id: 'tx-4',
    cardId: 'card-1',
    cardName: 'Techcombank (9921)',
    merchant: 'Chuyển Khoản Lương Tháng',
    category: 'salary',
    categoryLabel: 'Thu nhập',
    amount: 35000000,
    type: 'income',
    date: '01/10/2026',
    time: '10:00',
    note: 'Lương chuyển khoản',
    icon: 'trending-up-outline',
    color: '#10b981',
  },
];

const CardflowContext = createContext<CardflowContextType | null>(null);

export function CardflowProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<MobileCard[]>(INITIAL_CARDS);
  const [transactions, setTransactions] = useState<MobileTransaction[]>(INITIAL_TRANSACTIONS);
  const [activeCardId, setActiveCardId] = useState<string>(INITIAL_CARDS[0]?.id || '');

  const totalLimit = cards.reduce((acc, c) => acc + c.dailyLimit, 0);
  const totalSpent = cards.reduce((acc, c) => acc + c.spentToday, 0);
  const totalAvailable = cards.reduce((acc, c) => acc + c.balance, 0);

  const addCard = (cardData: Omit<MobileCard, 'id' | 'spentToday' | 'isLocked'>) => {
    const newCard: MobileCard = {
      ...cardData,
      id: `card-${Date.now()}`,
      spentToday: 0,
      isLocked: false,
    };
    setCards((prev) => [newCard, ...prev]);
    setActiveCardId(newCard.id);
  };

  const updateCardLimit = (cardId: string, newLimit: number) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const diff = newLimit - c.dailyLimit;
          return {
            ...c,
            dailyLimit: newLimit,
            balance: Math.max(0, c.balance + diff),
          };
        }
        return c;
      })
    );
  };

  const toggleCardLock = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isLocked: !c.isLocked } : c))
    );
  };

  const toggleCardSetting = (
    cardId: string,
    setting: 'onlinePayment' | 'internationalPayment' | 'atmWithdrawal'
  ) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, [setting]: !c[setting] } : c))
    );
  };

  const addTransaction = (txData: Omit<MobileTransaction, 'id'>) => {
    const newTx: MobileTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Trừ hoặc cộng vào số dư thẻ tương ứng
    if (txData.cardId) {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === txData.cardId) {
            if (txData.type === 'expense') {
              return {
                ...c,
                balance: Math.max(0, c.balance - txData.amount),
                spentToday: c.spentToday + txData.amount,
              };
            } else {
              return {
                ...c,
                balance: c.balance + txData.amount,
              };
            }
          }
          return c;
        })
      );
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <CardflowContext.Provider
      value={{
        cards,
        transactions,
        activeCardId,
        setActiveCardId,
        addCard,
        updateCardLimit,
        toggleCardLock,
        toggleCardSetting,
        addTransaction,
        deleteTransaction,
        totalLimit,
        totalSpent,
        totalAvailable,
      }}
    >
      {children}
    </CardflowContext.Provider>
  );
}

export function useCardflow() {
  const ctx = useContext(CardflowContext);
  if (!ctx) {
    throw new Error('useCardflow must be used within a CardflowProvider');
  }
  return ctx;
}
