'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircleFilled,
  HomeOutlined,
  LogoutOutlined,
  PlusOutlined,
  SearchOutlined,
  CreditCardOutlined,
  PieChartOutlined,
  SettingOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TableOutlined,
  UnorderedListOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LockOutlined,
  UnlockOutlined,
  DownloadOutlined,
  ShoppingOutlined,
  CarOutlined,
  CoffeeOutlined,
  LaptopOutlined,
  DollarOutlined,
  StarOutlined,
  CloseOutlined,
  CloseCircleFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

import { PersonalCard3D, type CardTheme } from '../_components/PersonalCard3D';
import { CardQuickControls } from '../_components/CardQuickControls';
import { CardBalanceCard } from '../_components/CardBalanceCard';
import { ChangePinModal } from '../_components/ChangePinModal';
import { SetLimitModal } from '../_components/SetLimitModal';
import { AddCardModal, type CardDataModel } from '../_components/AddCardModal';
import { VerifyPinModal } from '../_components/VerifyPinModal';
import { ExportReportModal } from '../_components/ExportReportModal';
import { ImportSheetModal } from '../_components/ImportSheetModal';
import { AppSettingsHub } from '../_components/AppSettingsHub';

import { TransactionExpenseManager } from '../_components/TransactionExpenseManager';
import type { UserProfile } from '@cardflow-app/shared';
import { DEFAULT_USER_PROFILE } from '@cardflow-app/shared';
import {
  getCardsAction,
  toggleLockAction,
  createCardAction,
  setLimitAction,
} from '../actions/card-security';

// INITIAL MOCK CARDS DATA
const INITIAL_CARDS: CardDataModel[] = [
  {
    id: 'card-1',
    nickname: 'Thẻ Chính Platinum',
    bankName: 'Cardflow Bank',
    cardType: 'VISA PLATINUM',
    lastFourDigits: '9921',
    cardNumberFormatted: '•••• •••• •••• 9921',
    nfcId: 'CF-NFC-9921-PL',
    holderName: 'LÊ HUỲNH THUẬN',
    expiryDate: '09/30',
    cvv: '•••',
    theme: 'dark-cyber',
    isLocked: false,
    isDefault: true,
    balance: 25500000,
    dailyLimit: 50000000,
    spentToday: 14250000,
    onlinePayment: true,
    internationalPayment: true,
    atmWithdrawal: true,
    notificationsEnabled: true,
  },
  {
    id: 'card-2',
    nickname: 'Thẻ Phụ Gold VIP',
    bankName: 'Techcombank',
    cardType: 'VISA GOLD',
    lastFourDigits: '4412',
    cardNumberFormatted: '•••• •••• •••• 4412',
    nfcId: 'CF-NFC-4412-GD',
    holderName: 'LÊ HUỲNH THUẬN',
    expiryDate: '12/28',
    cvv: '•••',
    theme: 'gold-luxe',
    isLocked: false,
    isDefault: false,
    balance: 12000000,
    dailyLimit: 20000000,
    spentToday: 3500000,
    onlinePayment: true,
    internationalPayment: false,
    atmWithdrawal: true,
    notificationsEnabled: true,
  },
  {
    id: 'card-3',
    nickname: 'Thẻ Thanh Toán Deep Sapphire',
    bankName: 'Vietcombank',
    cardType: 'MASTERCARD BLACK',
    lastFourDigits: '8834',
    cardNumberFormatted: '•••• •••• •••• 8834',
    nfcId: 'CF-NFC-8834-SP',
    holderName: 'LÊ HUỲNH THUẬN',
    expiryDate: '05/29',
    cvv: '•••',
    theme: 'deep-sapphire',
    isLocked: true,
    isDefault: false,
    balance: 8500000,
    dailyLimit: 15000000,
    spentToday: 0,
    onlinePayment: false,
    internationalPayment: false,
    atmWithdrawal: false,
    notificationsEnabled: false,
  },
];

// MOCK DETAILED TRANSACTIONS DATA
interface TransactionItem {
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

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  { id: 'tx-101', cardId: 'card-1', cardLast4: '9921', merchant: 'Thế Giới Di Động - Laptop Pro', category: 'tech', categoryLabel: 'Công nghệ', amount: -12500000, type: 'expense', date: '2026-09-22', dateDisplay: 'Hôm nay', time: '14:32', status: 'Thành công', referenceId: 'TXN-9921-88412' },
  { id: 'tx-102', cardId: 'card-1', cardLast4: '9921', merchant: 'Starbucks Coffee Reserve', category: 'dining', categoryLabel: 'Ăn uống', amount: -185000, type: 'expense', date: '2026-09-22', dateDisplay: 'Hôm nay', time: '09:15', status: 'Thành công', referenceId: 'TXN-9921-88390' },
  { id: 'tx-103', cardId: 'card-2', cardLast4: '4412', merchant: 'Grab Car - Chuyến đi Q1', category: 'transport', categoryLabel: 'Di chuyển', amount: -145000, type: 'expense', date: '2026-09-22', dateDisplay: 'Hôm nay', time: '08:40', status: 'Thành công', referenceId: 'TXN-4412-10492' },
  { id: 'tx-104', cardId: 'card-1', cardLast4: '9921', merchant: 'Nạp tiền hoàn tức thời vCard', category: 'refund', categoryLabel: 'Hoàn tiền', amount: 500000, type: 'income', date: '2026-09-21', dateDisplay: 'Hôm qua', time: '18:20', status: 'Thành công', referenceId: 'TXN-9921-77201' },
  { id: 'tx-105', cardId: 'card-2', cardLast4: '4412', merchant: 'Uniqlo Vincom Landmark', category: 'shopping', categoryLabel: 'Mua sắm', amount: -2350000, type: 'expense', date: '2026-09-21', dateDisplay: 'Hôm qua', time: '16:05', status: 'Thành công', referenceId: 'TXN-4412-09412' },
  { id: 'tx-106', cardId: 'card-3', cardLast4: '8834', merchant: 'Apple Store Online Store', category: 'tech', categoryLabel: 'Công nghệ', amount: -4590000, type: 'expense', date: '2026-09-20', dateDisplay: '20/09/2026', time: '11:00', status: 'Thành công', referenceId: 'TXN-8834-00129' },
  { id: 'tx-107', cardId: 'card-1', cardLast4: '9921', merchant: 'CGV Cinema Premiere', category: 'dining', categoryLabel: 'Giải trí', amount: -320000, type: 'expense', date: '2026-09-19', dateDisplay: '19/09/2026', time: '20:15', status: 'Thành công', referenceId: 'TXN-9921-65412' },
];

export default function FullscreenDashboard() {
  // Sidebar Collapse & Tab Routing State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'transactions' | 'stats' | 'settings'>('overview');

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  // Cards View Mode State ('grid' | 'table' | 'list')
  const [cardsViewMode, setCardsViewMode] = useState<'grid' | 'table' | 'list'>('grid');

  // Sync user profile and cards view mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cardflow_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.fullName) {
            setUserProfile(parsed);
          }
        }

        const savedView = localStorage.getItem('cardflow_cards_view_mode') as 'grid' | 'table' | 'list' | null;
        if (savedView && ['grid', 'table', 'list'].includes(savedView)) {
          setCardsViewMode(savedView);
        }
      } catch {
        // Ignore localStorage parsing issues
      }
    }
  }, []);

  const getCardMiniGradient = (theme: CardTheme) => {
    switch (theme) {
      case 'gold-elegance':
      case 'gold-luxe':
        return 'linear-gradient(135deg, #d4af37, #78350f)';
      case 'crimson-ruby':
        return 'linear-gradient(135deg, #ef4444, #7f1d1d)';
      case 'deep-sapphire':
        return 'linear-gradient(135deg, #0284c7, #1e3a8a)';
      case 'holographic':
        return 'linear-gradient(135deg, #ec4899, #8b5cf6)';
      case 'dark-cyber':
      default:
        return 'linear-gradient(135deg, #06b6d4, #0f172a)';
    }
  };

  const handleCardsViewModeChange = (mode: 'grid' | 'table' | 'list') => {
    setCardsViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cardflow_cards_view_mode', mode);
      } catch {
        // Ignore storage errors
      }
    }
  };

  const getUserInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[parts.length - 2]?.[0] ?? '';
      const second = parts[parts.length - 1]?.[0] ?? '';
      return (first + second).toUpperCase() || 'CF';
    }
    return (parts[0]?.[0] ?? 'CF').toUpperCase();
  };


  const handleAddTransaction = (newTxData: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => {
    const newTx: TransactionItem = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      referenceId: `TXN-${newTxData.cardLast4}-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Thành công',
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (newTx.type === 'expense') {
      setCards((prev) =>
        prev.map((c) =>
          c.id === newTx.cardId
            ? { ...c, spentToday: c.spentToday + Math.abs(newTx.amount) }
            : c
        )
      );
    }
  };

  const handleProfileSave = (updated: UserProfile) => {
    setUserProfile(updated);
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        holderName: updated.fullName.toUpperCase(),
      }))
    );
    showToast(`✨ Đã cập nhật hồ sơ: ${updated.fullName}`);
  };

  // Cards State & Selection

  const [cards, setCards] = useState<CardDataModel[]>(INITIAL_CARDS);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);
  const [activeCardId, setActiveCardId] = useState<string>('card-1');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [decryptedSensitiveData, setDecryptedSensitiveData] = useState<
    Record<string, { fullCardNumber: string; cvv: string }>
  >({});
  const [sensitiveCountdown, setSensitiveCountdown] = useState<number>(0);
  const [isVerifyPinModalOpen, setIsVerifyPinModalOpen] = useState(false);
  const [targetCardForPin, setTargetCardForPin] = useState<{ id: string; name: string } | null>(null);

  // Sync cards from Go Backend / PostgreSQL on mount
  useEffect(() => {
    let isMounted = true;
    getCardsAction().then((dbCards) => {
      if (!isMounted) return;
      if (dbCards && dbCards.length > 0) {
        setCards(dbCards as unknown as CardDataModel[]);
        setActiveCardId((prev) => (dbCards.some((c) => c.id === prev) ? prev : dbCards[0]!.id));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // User Balance Privacy State
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'security' | 'payments' | 'preferences' | 'sessions' | 'cloud'>('security');

  const handleToggleHideBalance = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      showToast(next ? '🔒 Đã ẩn số dư tài khoản' : '👁️ Đã hiển thị số dư tài khoản');
      return next;
    });
  };

  // Filter & Search States for Transactions
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txCardFilter, setTxCardFilter] = useState<string>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [txTimeFilter, setTxTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  void setTxCardFilter;
  void setTxTypeFilter;
  void setTxTimeFilter;

  // Modals & Triggers
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isDetailCardModalOpen, setIsDetailCardModalOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImportTransactionsSuccess = (
    newTransactions: TransactionItem[],
    targetCardId?: string,
  ) => {
    if (!newTransactions || newTransactions.length === 0) return;

    // Prepend imported transactions to state, avoiding duplicate reference IDs if any
    setTransactions((prev) => {
      const existingRefs = new Set(prev.map((t) => t.referenceId));
      const toAdd = newTransactions.filter((t) => !existingRefs.has(t.referenceId));
      return [...toAdd, ...prev];
    });

    // Calculate spending added to update card spentToday
    const addedExpensesByCard: Record<string, number> = {};
    newTransactions.forEach((tx) => {
      if (tx.amount < 0) {
        const cid = targetCardId || tx.cardId;
        addedExpensesByCard[cid] = (addedExpensesByCard[cid] || 0) + Math.abs(tx.amount);
      }
    });

    if (Object.keys(addedExpensesByCard).length > 0) {
      setCards((prev) =>
        prev.map((c) => {
          const added = addedExpensesByCard[c.id];
          if (added) {
            return { ...c, spentToday: c.spentToday + added };
          }
          return c;
        }),
      );
    }
  };

  // SINGLE SOURCE OF TRUTH for Active Card
  const activeCard: CardDataModel = (cards.find((c) => c.id === activeCardId) || cards[0] || INITIAL_CARDS[0])!;


  // Auto-hide sensitive data & wipe memory after countdown expires
  useEffect(() => {
    if (!showSensitiveData || sensitiveCountdown <= 0) return;

    const timer = setInterval(() => {
      setSensitiveCountdown((prev) => {
        if (prev <= 1) {
          setShowSensitiveData(false);
          setDecryptedSensitiveData({});
          showToast('🔒 Đã tự động ẩn và xóa dữ liệu nhạy cảm khỏi bộ nhớ');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSensitiveData, sensitiveCountdown]);

  // Card Selection Handler (Reset sensitive state & memory when changing cards)
  const handleSelectCard = (id: string, openDetailModal = false) => {
    setActiveCardId(id);
    setShowSensitiveData(false);
    setDecryptedSensitiveData({});
    setSensitiveCountdown(0);
    if (openDetailModal) {
      setIsDetailCardModalOpen(true);
    }
  };

  // Secure PIN verification flow trigger
  const handleRequestToggleSensitive = (cardId: string, cardName: string) => {
    if (showSensitiveData && decryptedSensitiveData[cardId]) {
      setShowSensitiveData(false);
      setDecryptedSensitiveData((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
      setSensitiveCountdown(0);
      showToast('🔒 Đã bảo mật và ẩn thông tin thẻ');
      return;
    }

    setTargetCardForPin({ id: cardId, name: cardName });
    setIsVerifyPinModalOpen(true);
  };

  const handleVerifyPinSuccess = (result: {
    decryptedData?: { fullCardNumber: string; cvv: string };
    expiresInSeconds?: number;
  }) => {
    if (!targetCardForPin || !result.decryptedData) return;

    const cardId = targetCardForPin.id;
    const expiresSec = result.expiresInSeconds || 20;

    setDecryptedSensitiveData((prev) => ({
      ...prev,
      [cardId]: result.decryptedData!,
    }));
    setShowSensitiveData(true);
    setSensitiveCountdown(expiresSec);
    showToast(`🔓 Xác thực thành công. Thông tin thẻ sẽ tự ẩn sau ${expiresSec}s`);
  };

  const handleToggleLock = async (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    const nextLock = !target.isLocked;

    // Optimistic UI update
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          showToast(nextLock ? `🔒 Đã khóa thẻ ${c.nickname}` : `🔓 Đã mở khóa thẻ ${c.nickname}`);
          return { ...c, isLocked: nextLock };
        }
        return c;
      })
    );

    // Call Go Backend
    const res = await toggleLockAction({ cardId: id });
    if (!res.success) {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isLocked: target.isLocked } : c))
      );
      showToast(`⚠️ Lỗi lưu trạng thái khóa: ${res.error}`);
    }
  };

  const handleSetDefaultCard = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );
    showToast('⭐ Đã đặt làm thẻ cá nhân mặc định');
  };

  const handleToggleSecuritySetting = (id: string, key: 'onlinePayment' | 'internationalPayment' | 'atmWithdrawal' | 'notificationsEnabled') => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextVal = !c[key];
          showToast(`⚡ Cập nhật tính năng bảo mật: ${key} = ${nextVal ? 'BẬT' : 'TẮT'}`);
          return { ...c, [key]: nextVal };
        }
        return c;
      })
    );
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      showToast('⚠️ Bạn phải duy trì ít nhất 1 Thẻ Cá Nhân trong tài khoản!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa thẻ cá nhân này khỏi hệ thống?')) {
      const remaining = cards.filter((c) => c.id !== id);
      setCards(remaining);
      if (activeCardId === id && remaining[0]) {
        setActiveCardId(remaining[0].id);
      }
      showToast('🗑️ Đã xóa thẻ cá nhân thành công');
    }
  };

  const handleAddCard = async (newCardData: Omit<CardDataModel, 'id' | 'isLocked' | 'balance' | 'spentToday'>) => {
    const res = await createCardAction({
      nickname: newCardData.nickname,
      bankName: newCardData.bankName,
      cardType: newCardData.cardType,
      holderName: newCardData.holderName,
      theme: newCardData.theme,
      fullCardNumber: newCardData.cardNumberFormatted.replace(/\s+/g, ''),
      expiryDate: newCardData.expiryDate,
      cvv: newCardData.cvv,
    });

    if (res.success && res.card) {
      const created = res.card as unknown as CardDataModel;
      setCards((prev) => [...prev, created]);
      setActiveCardId(created.id);
      showToast(`✨ Đã thêm thẻ cá nhân mới "${created.nickname}" thành công (Đã lưu vào DB)`);
    } else {
      const newId = `card-${Date.now()}`;
      const newCard: CardDataModel = {
        ...newCardData,
        id: newId,
        isLocked: false,
        balance: 10000000,
        spentToday: 0,
      };
      setCards((prev) => [...prev, newCard]);
      setActiveCardId(newId);
      showToast(`✨ Đã thêm thẻ cá nhân mới "${newCard.nickname}" (Chế độ offline)`);
    }
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (txCardFilter !== 'all' && tx.cardId !== txCardFilter) return false;
    if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
    if (txSearchQuery) {
      const q = txSearchQuery.toLowerCase().trim();
      const matchMerchant = tx.merchant.toLowerCase().includes(q);
      const matchCategory = tx.categoryLabel.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q);
      const matchCardLast4 = tx.cardLast4.includes(q);
      const matchRef = tx.referenceId.toLowerCase().includes(q);
      if (!matchMerchant && !matchCategory && !matchCardLast4 && !matchRef) return false;
    }
    if (txTimeFilter === 'today' && tx.dateDisplay !== 'Hôm nay') return false;
    if (txTimeFilter === 'week' && tx.date < '2026-09-16') return false;
    return true;
  });

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dining': return <CoffeeOutlined style={{ color: '#f59e0b' }} />;
      case 'shopping': return <ShoppingOutlined style={{ color: '#ec4899' }} />;
      case 'transport': return <CarOutlined style={{ color: '#3b82f6' }} />;
      case 'tech': return <LaptopOutlined style={{ color: '#8b5cf6' }} />;
      case 'refund': return <DollarOutlined style={{ color: '#22c55e' }} />;
      default: return <CreditCardOutlined style={{ color: '#38bdf8' }} />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #1e293b inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        input[type="search"]::-webkit-search-decoration,
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-results-button,
        input[type="search"]::-webkit-search-results-decoration {
          display: none;
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20000,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            borderRadius: '20px',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <CheckCircleFilled style={{ color: '#4ade80' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (COLLAPSIBLE) */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: isSidebarCollapsed ? '72px' : '240px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxSizing: 'border-box',
          zIndex: 100,
        }}
        className="dashboard-sidebar"
      >
        <div>
          {/* Top Logo & Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', marginBottom: '32px' }}>
            {!isSidebarCollapsed && (
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '16px',
                    color: '#fff',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                  }}
                >
                  CF
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Cardflow</div>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>Personal VIP</div>
                </div>
              </Link>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'overview', label: 'Tổng quan', icon: <AppstoreOutlined /> },
              { id: 'cards', label: 'Thẻ của tôi', icon: <CreditCardOutlined /> },
              { id: 'transactions', label: 'Giao dịch', icon: <HistoryOutlined /> },
              { id: 'stats', label: 'Thống kê', icon: <PieChartOutlined /> },
              { id: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
              { id: 'cloud', label: 'Google Cloud (Drive/Sheets)', icon: <CloudUploadOutlined /> },
            ].map((item) => {
              const isSelected = item.id === 'cloud' 
                ? (activeTab === 'settings' && settingsSubTab === 'cloud')
                : (activeTab === item.id && (item.id !== 'settings' || settingsSubTab !== 'cloud'));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'cloud') {
                      setSettingsSubTab('cloud');
                      setActiveTab('settings');
                    } else {
                      if (item.id === 'settings') {
                        setSettingsSubTab('security');
                      }
                      setActiveTab(item.id as any);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isSelected ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(56, 189, 248, 0.15) 100%)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    transition: 'all 0.2s ease',
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Link */}
        <div>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontSize: '13px',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <HomeOutlined />
            {!isSidebarCollapsed && <span>Trang giới thiệu</span>}
          </Link>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN FULL-SCREEN CONTENT AREA */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TOPBAR */}
        <header
          style={{
            height: '70px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          {/* Breadcrumb / Title */}
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              {activeTab === 'overview' && 'Bảng Quản Lý Thẻ Cá Nhân — Tổng Quan'}
              {activeTab === 'cards' && 'Danh Sách Thẻ Cá Nhân Của Tôi'}
              {activeTab === 'transactions' && 'Lịch Sử Giao Dịch Chi Tiết'}
              {activeTab === 'stats' && 'Thống Kê & Báo Cáo Phân Tích Chi Tiêu'}
              {activeTab === 'settings' && 'Cài Đặt Tài Khoản & Bảo Mật'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Cardflow Dashboard • {cards.length}/5 Thẻ Cá Nhân Đang Hoạt Động
            </div>
          </div>

          {/* Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px 14px',
              width: '260px',
            }}
            className="topbar-search"
          >
            <SearchOutlined style={{ color: '#64748b', marginRight: '8px', flexShrink: 0 }} />
            <input
              type="search"
              name="topbar_search_tx_no_autofill"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Tìm nhanh giao dịch, thẻ..."
              value={txSearchQuery}
              onChange={(e) => setTxSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '13px',
                width: '100%',
              }}
            />
            {txSearchQuery ? (
              <button
                type="button"
                onClick={() => setTxSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                title="Xóa tìm kiếm"
              >
                <CloseCircleFilled style={{ fontSize: '14px' }} />
              </button>
            ) : null}
          </div>

          {/* User & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Quick Export to Google Sheets & Drive */}
            <button
              type="button"
              onClick={() => setIsExportReportOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s',
              }}
              title="Xuất bảng sao kê sang Google Sheets hoặc lưu Drive"
            >
              <TableOutlined /> Xuất Báo Cáo & Sheets
            </button>

            <button
              onClick={() => setIsAddCardOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
              }}
            >
              <PlusOutlined /> Thêm thẻ mới
            </button>

            {/* Quick Balance Privacy Toggle */}
            <button
              type="button"
              onClick={handleToggleHideBalance}
              style={{
                background: isBalanceHidden ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                border: `1px solid ${isBalanceHidden ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                color: isBalanceHidden ? '#38bdf8' : '#cbd5e1',
                padding: '8px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              title={isBalanceHidden ? 'Hiển thị số dư' : 'Ẩn số dư bảo mật'}
            >
              {isBalanceHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              <span>{isBalanceHidden ? 'Số dư: Ẩn' : 'Số dư: Hiện'}</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingLeft: '12px',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('settings')}
              title="Nhấp để chuyển tới Cài đặt & chỉnh sửa hồ sơ"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: '#ffffff',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid rgba(56, 189, 248, 0.4)',
                }}
              >
                {userProfile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getUserInitials(userProfile.fullName)
                )}
              </div>
              <div className="topbar-username">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {userProfile.fullName}
                </div>
                <div style={{ fontSize: '10px', color: '#38bdf8' }}>
                  {userProfile.nickname ? `@${userProfile.nickname}` : (userProfile.role ?? 'Chủ Thẻ VIP')}
                </div>
              </div>

              <a
                href="/api/auth/logout"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: '#fca5a5',
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  marginLeft: '4px',
                }}
                title="Đăng xuất"
              >
                <LogoutOutlined style={{ fontSize: '14px' }} />
              </a>
            </div>
          </div>
        </header>

        {/* CONDITIONAL TAB VIEWS */}
        <main style={{ flex: 1, padding: '24px' }}>
          {/* ========================================================================= */}
          {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 380px',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {/* Column Left (~65%) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                {/* CAROUSEL THẺ CÁ NHÂN */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCardOutlined style={{ color: '#38bdf8' }} /> Danh Sách Thẻ Cá Nhân ({cards.length})
                    </div>
                    <button onClick={() => setIsAddCardOpen(true)} style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      + Thêm thẻ mới
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {cards.map((card) => {
                      const isActive = card.id === activeCardId;
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleSelectCard(card.id)}
                          style={{
                            minWidth: '220px',
                            padding: '16px',
                            borderRadius: '16px',
                            background: card.theme === 'gold-luxe' 
                              ? 'linear-gradient(135deg, #78350f 0%, #b45309 100%)'
                              : card.theme === 'deep-sapphire'
                              ? 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)'
                              : 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)',
                            border: isActive ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isActive ? '0 0 20px rgba(56, 189, 248, 0.35)' : 'none',
                            cursor: 'pointer',
                            transform: isActive ? 'scale(1.02)' : 'scale(0.98)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}
                        >
                          {card.isDefault && (
                            <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: 700 }}>
                              MẶC ĐỊNH
                            </span>
                          )}

                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{card.bankName}</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>{card.nickname}</div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', letterSpacing: '2px', fontWeight: 700, marginBottom: '8px' }}>•••• {card.lastFourDigits}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ color: card.isLocked ? '#fca5a5' : '#4ade80', fontWeight: 700 }}>{card.isLocked ? '🔒 ĐÃ KHÓA' : '⚡ HOẠT ĐỘNG'}</span>
                            <span style={{ color: '#94a3b8' }}>{card.cardType.split(' ')[0]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE CARD DYNAMIC DISPLAY & CONTROL PANEL */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>ĐANG CHỌN THẺ CÁ NHÂN</span>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{activeCard.nickname}</h2>
                    </div>

                    <button
                      onClick={() => handleToggleLock(activeCard.id)}
                      style={{
                        background: activeCard.isLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                        border: `1px solid ${activeCard.isLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                        color: activeCard.isLocked ? '#fca5a5' : '#4ade80',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {activeCard.isLocked ? <LockOutlined /> : <UnlockOutlined />}
                      {activeCard.isLocked ? ' Mở Khóa Thẻ' : ' Khóa Thẻ Tạm Thời'}
                    </button>
                  </div>

                  {/* Dynamic 3D Card Pass All Props */}
                  <div style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
                    <PersonalCard3D
                      theme={activeCard.theme}
                      isLocked={activeCard.isLocked}
                      showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
                      onToggleLock={() => handleToggleLock(activeCard.id)}
                      onToggleSensitiveData={() => handleRequestToggleSensitive(activeCard.id, activeCard.nickname)}
                      holderName={activeCard.holderName}
                      cardNumberFormatted={decryptedSensitiveData[activeCard.id]?.fullCardNumber}
                      lastFourDigits={activeCard.lastFourDigits}
                      expiryDate={activeCard.expiryDate}
                      cvv={decryptedSensitiveData[activeCard.id]?.cvv}
                      cardType={activeCard.cardType}
                      nfcId={activeCard.nfcId}
                      bankName={activeCard.bankName}
                    />
                  </div>

                  {/* Actions Bar */}
                  <CardQuickControls
                    currentTheme={activeCard.theme}
                    isLocked={activeCard.isLocked}
                    showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
                    countdownSeconds={sensitiveCountdown}
                    onToggleLock={() => handleToggleLock(activeCard.id)}
                    onToggleSensitiveData={() => handleRequestToggleSensitive(activeCard.id, activeCard.nickname)}
                    onOpenChangePin={() => setIsPinModalOpen(true)}
                    onOpenSetLimit={() => setIsLimitModalOpen(true)}
                    onThemeChange={(newTheme) => {
                      setCards((prev) =>
                        prev.map((c) => (c.id === activeCard.id ? { ...c, theme: newTheme } : c))
                      );
                    }}
                  />

                  {/* Security Toggles */}
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', textAlign: 'left' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Thanh toán Online</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Thanh toán TMĐT</div>
                      </div>
                      <input type="checkbox" checked={activeCard.onlinePayment} onChange={() => handleToggleSecuritySetting(activeCard.id, 'onlinePayment')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    </div>

                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Thanh toán Quốc tế</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Giao dịch nước ngoài</div>
                      </div>
                      <input type="checkbox" checked={activeCard.internationalPayment} onChange={() => handleToggleSecuritySetting(activeCard.id, 'internationalPayment')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>

                {/* Transactions Feed */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Giao Dịch Gần Đây</div>
                    <button onClick={() => setActiveTab('transactions')} style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Xem tất cả →</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredTransactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} onClick={() => setSelectedTxDetail(tx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{getCategoryIcon(tx.category)}</div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{tx.merchant}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{tx.dateDisplay} • {tx.time}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: tx.amount > 0 ? '#4ade80' : '#f8fafc' }}>
                          {tx.amount > 0 ? `+${tx.amount.toLocaleString('vi-VN')} ₫` : `${tx.amount.toLocaleString('vi-VN')} ₫`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column Right (~35%) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                <CardBalanceCard
                  balance={activeCard.balance}
                  dailyLimit={activeCard.dailyLimit}
                  spentToday={activeCard.spentToday}
                  rewardPoints={1450}
                  isBalanceHidden={isBalanceHidden}
                  onToggleHideBalance={handleToggleHideBalance}
                />

                {/* Category Stats */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>Thống Kê Chi Tiêu Tháng 9</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#cbd5e1' }}>💻 Công nghệ & Thiết bị</span>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>12.500.000 ₫ (65%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#cbd5e1' }}>🛍️ Mua sắm & Thời trang</span>
                        <span style={{ color: '#ec4899', fontWeight: 700 }}>2.350.000 ₫ (20%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '20%', height: '100%', background: 'linear-gradient(90deg, #ec4899 0%, #be185d 100%)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Cloud & Quick Export Widget */}
                <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CloudUploadOutlined style={{ color: '#10b981', fontSize: '18px' }} />
                      <span>Google Drive & Sheets</span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      TÍCH HỢP SẴN
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                    Xuất toàn bộ giao dịch sang Google Sheets với format tài chính chuẩn hoặc sao lưu file vào Google Drive.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsExportReportOpen(true)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <TableOutlined /> Xuất Báo Cáo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsSubTab('cloud');
                        setActiveTab('settings');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Cài đặt kết nối Google Cloud"
                    >
                      Cài Đặt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: THẺ CỦA TÔI (CARDS) */}
          {/* ========================================================================= */}
          {activeTab === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>Quản Lý Tất Cả Thẻ Cá Nhân ({cards.length})</h2>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Bấm vào bất kỳ thẻ nào để mở xem chi tiết & tương tác 3D</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* View Mode Switcher: Lưới / Bảng / Danh sách */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(15, 23, 42, 0.85)',
                      padding: '4px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      gap: '4px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <button
                      onClick={() => handleCardsViewModeChange('grid')}
                      title="Chế độ xem dạng lưới (Cards)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: cardsViewMode === 'grid' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        color: cardsViewMode === 'grid' ? '#38bdf8' : '#94a3b8',
                        fontWeight: cardsViewMode === 'grid' ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: cardsViewMode === 'grid' ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none',
                      }}
                    >
                      <AppstoreOutlined />
                      <span>Lưới</span>
                    </button>

                    <button
                      onClick={() => handleCardsViewModeChange('table')}
                      title="Chế độ xem dạng bảng chi tiết (Table)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: cardsViewMode === 'table' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        color: cardsViewMode === 'table' ? '#38bdf8' : '#94a3b8',
                        fontWeight: cardsViewMode === 'table' ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: cardsViewMode === 'table' ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none',
                      }}
                    >
                      <TableOutlined />
                      <span>Bảng</span>
                    </button>

                    <button
                      onClick={() => handleCardsViewModeChange('list')}
                      title="Chế độ xem dạng danh sách rút gọn (List)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: cardsViewMode === 'list' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        color: cardsViewMode === 'list' ? '#38bdf8' : '#94a3b8',
                        fontWeight: cardsViewMode === 'list' ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: cardsViewMode === 'list' ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none',
                      }}
                    >
                      <UnorderedListOutlined />
                      <span>Danh sách</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAddCardOpen(true)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    <PlusOutlined /> + Thêm thẻ mới
                  </button>
                </div>
              </div>

              {/* DẠNG 1: LƯỚI (GRID VIEW) */}
              {cardsViewMode === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {cards.map((card) => {
                    const isSelected = card.id === activeCardId;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleSelectCard(card.id, true)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '20px',
                          padding: '24px',
                          boxShadow: isSelected ? '0 0 25px rgba(56, 189, 248, 0.25)' : '0 10px 30px rgba(0,0,0,0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        className="my-card-grid-item"
                      >
                        {card.isDefault && (
                          <span style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                            <StarOutlined /> THẺ MẶC ĐỊNH
                          </span>
                        )}

                        <div>
                          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>{card.bankName}</div>
                          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{card.nickname}</h3>

                          <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#cbd5e1', letterSpacing: '2px', marginBottom: '16px' }}>
                            •••• •••• •••• {card.lastFourDigits}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                            <div>
                              <div>Hạn mức ngày:</div>
                              <div style={{ color: '#ffffff', fontWeight: 700 }}>
                                {isBalanceHidden ? '•••••••• ₫' : `${card.dailyLimit.toLocaleString('vi-VN')} ₫`}
                              </div>
                            </div>
                            <div>
                              <div>Trạng thái:</div>
                              <div style={{ color: card.isLocked ? '#fca5a5' : '#4ade80', fontWeight: 700 }}>{card.isLocked ? '🔒 Đã khóa' : '⚡ Hoạt động'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCard(card.id, true);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 0',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            🔍 Xem chi tiết 3D
                          </button>

                          {!card.isDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefaultCard(card.id);
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#cbd5e1',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Đặt mặc định
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(card.id);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: card.isLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                              border: `1px solid ${card.isLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                              color: card.isLocked ? '#fca5a5' : '#4ade80',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {card.isLocked ? 'Mở khóa' : 'Khóa thẻ'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(card.id);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#94a3b8',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DẠNG 2: BẢNG CHI TIẾT (TABLE VIEW) */}
              {cardsViewMode === 'table' && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(30, 41, 59, 0.65)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thẻ & Ngân hàng</th>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Số thẻ & Loại</th>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chủ thẻ</th>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hạn mức ngày</th>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hết hạn</th>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                          <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cards.map((card) => {
                          const isSelected = card.id === activeCardId;
                          return (
                            <tr
                              key={card.id}
                              onClick={() => handleSelectCard(card.id, true)}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {/* Thẻ & Ngân hàng */}
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '24px',
                                      borderRadius: '6px',
                                      background: getCardMiniGradient(card.theme),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#ffffff',
                                      fontSize: '13px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <CreditCardOutlined />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>{card.nickname}</span>
                                      {card.isDefault && (
                                        <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                          MẶC ĐỊNH
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#38bdf8' }}>{card.bankName}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Số thẻ & Loại */}
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#cbd5e1', fontSize: '13px', letterSpacing: '1px' }}>
                                  •••• {card.lastFourDigits}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{card.cardType || 'Thẻ ảo'}</div>
                              </td>

                              {/* Chủ thẻ */}
                              <td style={{ padding: '16px 20px', color: '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>
                                {card.holderName}
                              </td>

                              {/* Hạn mức ngày */}
                              <td style={{ padding: '16px 20px', color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>
                                {isBalanceHidden ? '•••••••• ₫' : `${card.dailyLimit.toLocaleString('vi-VN')} ₫`}
                              </td>

                              {/* Ngày hết hạn */}
                              <td style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '13px' }}>
                                {card.expiryDate}
                              </td>

                              {/* Trạng thái */}
                              <td style={{ padding: '16px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: card.isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                    color: card.isLocked ? '#fca5a5' : '#4ade80',
                                    border: `1px solid ${card.isLocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                                  }}
                                >
                                  {card.isLocked ? '🔒 Đã khóa' : '⚡ Hoạt động'}
                                </span>
                              </td>

                              {/* Thao tác */}
                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleSelectCard(card.id, true)}
                                    title="Xem chi tiết 3D"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                                      border: 'none',
                                      color: '#ffffff',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    3D
                                  </button>

                                  {!card.isDefault && (
                                    <button
                                      onClick={() => handleSetDefaultCard(card.id)}
                                      title="Đặt làm thẻ mặc định"
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#cbd5e1',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Mặc định
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleToggleLock(card.id)}
                                    title={card.isLocked ? 'Mở khóa thẻ' : 'Khóa thẻ'}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      background: card.isLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                                      border: `1px solid ${card.isLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                                      color: card.isLocked ? '#fca5a5' : '#4ade80',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {card.isLocked ? 'Mở' : 'Khóa'}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    title="Xóa thẻ"
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      color: '#94a3b8',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DẠNG 3: DANH SÁCH RÚT GỌN (COMPACT LIST VIEW) */}
              {cardsViewMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cards.map((card) => {
                    const isSelected = card.id === activeCardId;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleSelectCard(card.id, true)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          padding: '16px 20px',
                          boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.2)' : '0 4px 20px rgba(0, 0, 0, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Bên trái: Icon Thẻ & Thông tin */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '30px',
                              borderRadius: '8px',
                              background: getCardMiniGradient(card.theme),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '16px',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                              flexShrink: 0,
                            }}
                          >
                            <CreditCardOutlined />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{card.nickname}</span>
                              {card.isDefault && (
                                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                                  <StarOutlined /> MẶC ĐỊNH
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                              {card.bankName} • <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>•••• {card.lastFourDigits}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ở giữa: Chỉ số & Trạng thái */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Hạn mức ngày</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                              {isBalanceHidden ? '•••••••• ₫' : `${card.dailyLimit.toLocaleString('vi-VN')} ₫`}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Hết hạn</div>
                            <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>{card.expiryDate}</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Trạng thái</div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: card.isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                color: card.isLocked ? '#fca5a5' : '#4ade80',
                              }}
                            >
                              {card.isLocked ? '🔒 Đã khóa' : '⚡ Hoạt động'}
                            </span>
                          </div>
                        </div>

                        {/* Bên phải: Cụm nút hành động */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSelectCard(card.id, true)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            🔍 Xem 3D
                          </button>

                          {!card.isDefault && (
                            <button
                              onClick={() => handleSetDefaultCard(card.id)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#cbd5e1',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Đặt mặc định
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleLock(card.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: card.isLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                              border: `1px solid ${card.isLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                              color: card.isLocked ? '#fca5a5' : '#4ade80',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {card.isLocked ? 'Mở khóa' : 'Khóa'}
                          </button>

                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#94a3b8',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GIAO DỊCH (TRANSACTIONS) */}
          {/* ========================================================================= */}
          {/* TAB 3: GIAO DỊCH & QUẢN LÝ THU CHI (EXPENSE MANAGER) */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <TransactionExpenseManager
              transactions={transactions}
              cards={cards}
              isBalanceHidden={isBalanceHidden}
              onToggleBalance={() => setIsBalanceHidden((prev) => !prev)}
              onAddTransaction={handleAddTransaction}
              onOpenExportReport={() => setIsExportReportOpen(true)}
              onOpenImportSheet={() => setIsImportSheetOpen(true)}
              onToast={showToast}
            />

          )}

          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>Thống Kê & Báo Cáo Phân Tích</h2>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Theo dõi xu hướng chi tiêu và hiệu suất sử dụng hạn mức giữa các thẻ</div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExportReportOpen(true)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  title="Xuất báo cáo sao kê"
                >
                  <DownloadOutlined /> Xuất Báo Cáo Sao Kê
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Category Breakdown Chart */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>Phân Bổ Chi Tiêu Theo Danh Mục</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: '#cbd5e1' }}>💻 Công nghệ & Thiết bị</span>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>17.090.000 ₫ (70%)</span>
                      </div>
                      <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: '#cbd5e1' }}>🛍️ Mua sắm Thời trang</span>
                        <span style={{ color: '#ec4899', fontWeight: 700 }}>2.350.000 ₫ (18%)</span>
                      </div>
                      <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: '18%', height: '100%', background: 'linear-gradient(90deg, #ec4899 0%, #be185d 100%)' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: '#cbd5e1' }}>☕ Ăn uống & Di chuyển</span>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>1.650.000 ₫ (12%)</span>
                      </div>
                      <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: '12%', height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Card Limit Usage Comparison */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>So Sánh Hạn Mức Giữa Các Thẻ</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cards.map((c) => {
                      const pct = Math.min(Math.round((c.spentToday / c.dailyLimit) * 100), 100);
                      return (
                        <div key={c.id} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '14px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#ffffff' }}>{c.nickname}</span>
                            <span style={{ color: pct > 80 ? '#fca5a5' : '#4ade80', fontWeight: 700 }}>{c.spentToday.toLocaleString('vi-VN')} / {c.dailyLimit.toLocaleString('vi-VN')} ₫</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? '#ef4444' : '#38bdf8' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CÀI ĐẶT (SETTINGS) */}
          {/* ========================================================================= */}
          {/* TAB 5: CÀI ĐẶT & BẢO MẬT (SETTINGS HUB) */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <AppSettingsHub
              userProfile={userProfile}
              onProfileSave={handleProfileSave}
              isBalanceHidden={isBalanceHidden}
              onToggleBalance={() => setIsBalanceHidden((prev) => !prev)}
              onToast={showToast}
              initialSubTab={settingsSubTab}
            />
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS & DRAWERS */}
      {/* ========================================================================= */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
      />

      <ChangePinModal
        isOpen={isPinModalOpen}
        cardId={activeCard.id}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => showToast('🔑 Đổi mã PIN thẻ thành công')}
      />

      <SetLimitModal
        isOpen={isLimitModalOpen}
        currentLimit={activeCard.dailyLimit}
        onClose={() => setIsLimitModalOpen(false)}
        onSaveLimit={async (newLimit) => {
          const cardId = activeCard.id;
          const oldLimit = activeCard.dailyLimit;
          setCards((prev) =>
            prev.map((c) => (c.id === cardId ? { ...c, dailyLimit: newLimit } : c))
          );
          showToast(`📊 Đã cập nhật hạn mức ngày: ${newLimit.toLocaleString('vi-VN')} ₫`);

          const res = await setLimitAction({ cardId, dailyLimit: newLimit });
          if (!res.success) {
            setCards((prev) =>
              prev.map((c) => (c.id === cardId ? { ...c, dailyLimit: oldLimit } : c))
            );
            showToast(`⚠️ Không thể lưu hạn mức vào hệ thống: ${res.error}`);
          }
        }}
      />

      {/* CARD DETAIL POPUP MODAL (Triggered when clicking any card item) */}
      {isDetailCardModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>BẢNG CHI TIẾT THẺ CÁ NHÂN</span>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{activeCard.nickname}</h3>
              </div>
              <button
                onClick={() => setIsDetailCardModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Dynamic 3D Card Display */}
            <div style={{ maxWidth: '440px', margin: '0 auto 20px auto' }}>
              <PersonalCard3D
                theme={activeCard.theme}
                isLocked={activeCard.isLocked}
                showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
                onToggleLock={() => handleToggleLock(activeCard.id)}
                onToggleSensitiveData={() => handleRequestToggleSensitive(activeCard.id, activeCard.nickname)}
                holderName={activeCard.holderName}
                cardNumberFormatted={decryptedSensitiveData[activeCard.id]?.fullCardNumber}
                lastFourDigits={activeCard.lastFourDigits}
                expiryDate={activeCard.expiryDate}
                cvv={decryptedSensitiveData[activeCard.id]?.cvv}
                cardType={activeCard.cardType}
                nfcId={activeCard.nfcId}
                bankName={activeCard.bankName}
              />
            </div>

            {/* Core Action Buttons */}
            <CardQuickControls
              currentTheme={activeCard.theme}
              isLocked={activeCard.isLocked}
              showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
              countdownSeconds={sensitiveCountdown}
              onToggleLock={() => handleToggleLock(activeCard.id)}
              onToggleSensitiveData={() => handleRequestToggleSensitive(activeCard.id, activeCard.nickname)}
              onOpenChangePin={() => setIsPinModalOpen(true)}
              onOpenSetLimit={() => setIsLimitModalOpen(true)}
              onThemeChange={(newTheme) => {
                setCards((prev) =>
                  prev.map((c) => (c.id === activeCard.id ? { ...c, theme: newTheme } : c))
                );
              }}
            />

            {/* Close Modal Button */}
            <button
              onClick={() => setIsDetailCardModalOpen(false)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px 0',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Đóng Chi Tiết
            </button>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAIL MODAL */}
      {selectedTxDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🧾</div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Chi Tiết Giao Dịch</h3>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Mã GD: {selectedTxDetail.referenceId}</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Đơn vị chấp nhận</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>{selectedTxDetail.merchant}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Số tiền</span>
                <span style={{ fontWeight: 800, color: selectedTxDetail.amount > 0 ? '#4ade80' : '#f8fafc' }}>
                  {selectedTxDetail.amount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Thời gian</span>
                <span style={{ color: '#cbd5e1' }}>{selectedTxDetail.date} {selectedTxDetail.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Trạng thái</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>{selectedTxDetail.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  showToast('📩 Đã gửi báo cáo sai sót giao dịch đến bộ phận hỗ trợ');
                  setSelectedTxDetail(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Báo Cáo Sai Sót
              </button>

              <button
                onClick={() => setSelectedTxDetail(null)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secure PIN Verification Modal */}
      <VerifyPinModal
        isOpen={isVerifyPinModalOpen}
        cardId={targetCardForPin?.id || activeCard.id}
        cardName={targetCardForPin?.name || activeCard.nickname}
        onClose={() => setIsVerifyPinModalOpen(false)}
        onSuccess={handleVerifyPinSuccess}
      />

      {/* Export & Statement Report Preview Modal */}
      <ExportReportModal
        isOpen={isExportReportOpen}
        transactions={filteredTransactions.length > 0 ? filteredTransactions : INITIAL_TRANSACTIONS}
        holderName={activeCard.holderName}
        activeCardName={
          txCardFilter === 'all'
            ? 'Tất cả các thẻ'
            : cards.find((c) => c.id === txCardFilter)?.nickname || activeCard.nickname
        }
        onClose={() => setIsExportReportOpen(false)}
        onOpenImportSheet={() => setIsImportSheetOpen(true)}
        onToast={showToast}
      />

      {/* Import Transactions from Google Sheet Modal */}
      <ImportSheetModal
        isOpen={isImportSheetOpen}
        cards={cards}
        activeCardId={activeCard.id}
        onClose={() => setIsImportSheetOpen(false)}
        onImportSuccess={handleImportTransactionsSuccess}
        onToast={showToast}
      />
    </div>
  );

}
