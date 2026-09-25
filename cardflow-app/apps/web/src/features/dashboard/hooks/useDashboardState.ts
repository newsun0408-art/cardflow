'use client';

import { useState, useEffect } from 'react';
import type { CardDataModel } from '@/app/_components/AddCardModal';
import type { CardTheme } from '@/app/_components/PersonalCard3D';
import type { TransactionItem } from '@/features/transactions';
import type { DashboardTab, CardsViewMode } from '../types';
import type { UserProfile, CardDto } from '@cardflow-app/shared';
import {
  DEFAULT_USER_PROFILE,
  createApi,
  getCards,
  createCard,
  getTransactions,
  createTransaction,
  getGoogleDriveStatus,
  saveCardsToSheet,
  type SaveCardsToSheetInput,
} from '@cardflow-app/shared';

export const INITIAL_CARDS: CardDataModel[] = [
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
    isLocked: false,
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

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  { id: 'tx-101', cardId: 'card-1', cardLast4: '9921', merchant: 'Thế Giới Di Động - Laptop Pro', category: 'tech', categoryLabel: 'Công nghệ', amount: -12500000, type: 'expense', date: '2026-09-22', dateDisplay: 'Hôm nay', time: '14:32', status: 'Thành công', referenceId: 'TXN-9921-88412' },
  { id: 'tx-102', cardId: 'card-1', cardLast4: '9921', merchant: 'Starbucks Coffee Reserve', category: 'dining', categoryLabel: 'Ăn uống', amount: -185000, type: 'expense', date: '2026-09-22', dateDisplay: 'Hôm nay', time: '09:15', status: 'Thành công', referenceId: 'TXN-9921-88390' },
  { id: 'tx-103', cardId: 'card-2', cardLast4: '4412', merchant: 'Grab Car - Chuyến đi Q1', category: 'transport', categoryLabel: 'Di chuyển', amount: -145000, type: 'expense', date: '2026-09-22', dateDisplay: 'Hôm nay', time: '08:40', status: 'Thành công', referenceId: 'TXN-4412-10492' },
  { id: 'tx-104', cardId: 'card-1', cardLast4: '9921', merchant: 'Nạp tiền hoàn tức thời vCard', category: 'refund', categoryLabel: 'Hoàn tiền', amount: 500000, type: 'income', date: '2026-09-21', dateDisplay: 'Hôm qua', time: '18:20', status: 'Thành công', referenceId: 'TXN-9921-77201' },
  { id: 'tx-105', cardId: 'card-2', cardLast4: '4412', merchant: 'Uniqlo Vincom Landmark', category: 'shopping', categoryLabel: 'Mua sắm', amount: -2350000, type: 'expense', date: '2026-09-21', dateDisplay: 'Hôm qua', time: '16:05', status: 'Thành công', referenceId: 'TXN-4412-09412' },
  { id: 'tx-106', cardId: 'card-3', cardLast4: '8834', merchant: 'Apple Store Online Store', category: 'tech', categoryLabel: 'Công nghệ', amount: -4590000, type: 'expense', date: '2026-09-20', dateDisplay: '20/09/2026', time: '11:00', status: 'Thành công', referenceId: 'TXN-8834-00129' },
  { id: 'tx-107', cardId: 'card-1', cardLast4: '9921', merchant: 'CGV Cinema Premiere', category: 'dining', categoryLabel: 'Giải trí', amount: -320000, type: 'expense', date: '2026-09-19', dateDisplay: '19/09/2026', time: '20:15', status: 'Thành công', referenceId: 'TXN-9921-65412' },
];

export function useDashboardState() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [cardsViewMode, setCardsViewMode] = useState<CardsViewMode>('grid');

  const [cards, setCards] = useState<CardDataModel[]>(INITIAL_CARDS);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);
  const [activeCardId, setActiveCardId] = useState<string>('card-1');

  // Sensitive details state
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [decryptedSensitiveData, setDecryptedSensitiveData] = useState<Record<string, { fullCardNumber: string; cvv: string }>>({});
  const [sensitiveCountdown, setSensitiveCountdown] = useState<number>(0);
  const [isVerifyPinModalOpen, setIsVerifyPinModalOpen] = useState(false);
  const [targetCardForPin, setTargetCardForPin] = useState<{ id: string; name: string } | null>(null);

  // Balance privacy
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Filters
  const [txSearchQuery, setTxSearchQuery] = useState('');

  // Modals
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isDetailCardModalOpen, setIsDetailCardModalOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);

  // Google Drive & Sheets Sync
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);
  const [lastSheetUrl, setLastSheetUrl] = useState<string | null>(null);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check Google Drive status & listen for popup OAuth message
  useEffect(() => {
    try {
      const api = createApi();
      getGoogleDriveStatus(api)
        .then((res) => {
          if (res && res.connected) {
            setIsGoogleDriveConnected(true);
            if (res.state && typeof window !== 'undefined') {
              localStorage.setItem('cardflow_google_state', res.state);
            }
          }
        })
        .catch(() => {});
    } catch {
      // Ignore
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'GOOGLE_DRIVE_CONNECTED') {
        setIsGoogleDriveConnected(true);
        if (e.data.state && typeof window !== 'undefined') {
          localStorage.setItem('cardflow_google_state', e.data.state);
        }
        showToast('✅ Đã kết nối Google Drive & Sheets thành công!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync profile and view mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cardflow_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.fullName) setUserProfile(parsed);
        }

        const savedView = localStorage.getItem('cardflow_cards_view_mode') as CardsViewMode | null;
        if (savedView && ['grid', 'table', 'list'].includes(savedView)) {
          setCardsViewMode(savedView);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  // Backend Connection Status
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // Sync with Go backend
  useEffect(() => {
    try {
      const api = createApi();
      getCards(api)
        .then((res: any) => {
          const cardsList: CardDto[] = Array.isArray(res) ? res : (res?.data ?? []);
          if (cardsList && cardsList.length > 0) {
            console.log('[Cardflow API] Connected! Fetched cards from Go backend:', cardsList);
            setBackendStatus('connected');
            const liveCards: CardDataModel[] = cardsList.map((c, idx) => ({
              id: c.id,
              nickname: c.cardType === 'BLACK_TITANIUM' ? 'Thẻ Chính Titanium' : 'Thẻ Phụ Cyber',
              bankName: 'Cardflow Bank',
              cardType: c.cardType,
              lastFourDigits: c.cardNumber.replace(/\s+/g, '').slice(-4),
              cardNumberFormatted: '•••• •••• •••• ' + c.cardNumber.replace(/\s+/g, '').slice(-4),
              nfcId: `CF-NFC-${c.id}`,
              holderName: c.cardHolder,
              expiryDate: c.expiry,
              cvv: '•••',
              theme: idx % 2 === 0 ? 'dark-cyber' : 'holographic',
              isLocked: c.status === 'LOCKED',
              isDefault: idx === 0,
              balance: c.balance,
              dailyLimit: c.spendingLimit,
              spentToday: 0,
              onlinePayment: true,
              internationalPayment: true,
              atmWithdrawal: true,
              notificationsEnabled: true,
              createdAt: '2026-09-01',
            }));
            setCards(liveCards);
            setActiveCardId(liveCards[0]?.id ?? 'card-1');
          }
        })
        .catch((err) => {
          console.warn('[Cardflow API] Could not fetch cards, using local mock:', err);
          setBackendStatus('offline');
        });

      getTransactions(api)
        .then((res: any) => {
          const txList: any[] = Array.isArray(res) ? res : (res?.data ?? []);
          if (txList && txList.length > 0) {
            console.log('[Cardflow API] Connected! Fetched transactions from Go backend:', txList);
            const catMap: Record<string, { cat: TransactionItem['category']; label: string }> = {
              TECHNOLOGY: { cat: 'tech', label: 'Công nghệ' },
              FOOD: { cat: 'dining', label: 'Ăn uống' },
              TRANSPORT: { cat: 'transport', label: 'Di chuyển' },
              HOUSING: { cat: 'housing', label: 'Nhà cửa' },
              OTHER: { cat: 'other', label: 'Còn lại' },
            };
            const liveTxs: TransactionItem[] = txList.map((t) => {
              const mapped = catMap[t.category] || { cat: 'other', label: t.category };
              const datePart = t.createdAt ? t.createdAt.split(' ')[0] : '2026-09-23';
              const timePart = t.createdAt ? t.createdAt.split(' ')[1]?.slice(0, 5) ?? '12:00' : '12:00';
              return {
                id: t.id,
                cardId: t.cardId || 'card-1',
                cardLast4: '9921',
                merchant: t.title,
                category: mapped.cat,
                categoryLabel: mapped.label,
                amount: t.type === 'EXPENSE' ? -Math.abs(t.amount) : Math.abs(t.amount),
                type: t.type === 'EXPENSE' ? 'expense' : 'income',
                date: datePart,
                dateDisplay: datePart,
                time: timePart,
                status: t.status === 'SUCCESS' ? 'Thành công' : 'Đang xử lý',
                referenceId: `TXN-${t.id.slice(0, 8).toUpperCase()}`,
              };
            });
            setTransactions(liveTxs);
          }
        })
        .catch((err) => {
          console.warn('[Cardflow API] Could not fetch transactions, using local mock:', err);
        });
    } catch (e) {
      console.warn('[Cardflow API] Backend connection init error:', e);
      setBackendStatus('offline');
    }
  }, []);

  // Countdown timer for sensitive data auto-mask
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

  const activeCard: CardDataModel = (cards.find((c) => c.id === activeCardId) || cards[0] || INITIAL_CARDS[0])!;

  const handleCardsViewModeChange = (mode: CardsViewMode) => {
    setCardsViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cardflow_cards_view_mode', mode);
      } catch {
        // Ignore
      }
    }
  };

  const handleSelectCard = (id: string, openDetailModal = false) => {
    setActiveCardId(id);
    setShowSensitiveData(false);
    setDecryptedSensitiveData({});
    setSensitiveCountdown(0);
    if (openDetailModal) {
      setIsDetailCardModalOpen(true);
    }
  };

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

  const handleToggleLock = (_id: string) => {
    showToast('⚡ Thẻ luôn ở trạng thái hoạt động (không khóa thẻ)');
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

  const handleUpdateCard = (id: string, updatedFields: Partial<CardDataModel>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    showToast('✨ Đã cập nhật thông tin thẻ thành công');
  };

  const handleAddCard = (newCardData: Omit<CardDataModel, 'id' | 'isLocked' | 'balance' | 'spentToday'>) => {
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
    showToast(`✨ Đã thêm thẻ cá nhân mới "${newCard.nickname}" thành công`);

    try {
      const api = createApi();
      createCard(api, {
        cardHolder: newCardData.holderName || userProfile.fullName || 'LE HUYNH THUAN',
        cardType: newCardData.cardType,
        spendingLimit: newCardData.dailyLimit || 50000000,
      })
        .then((res: any) => {
          const cardObj = res?.id ? res : res?.data;
          if (cardObj?.id) {
            setCards((prev) =>
              prev.map((c) =>
                c.id === newId
                  ? {
                      ...c,
                      id: cardObj.id,
                      cardNumberFormatted: '•••• •••• •••• ' + cardObj.cardNumber.replace(/\s+/g, '').slice(-4),
                      lastFourDigits: cardObj.cardNumber.replace(/\s+/g, '').slice(-4),
                    }
                  : c
              )
            );
          }
        })
        .catch(() => {});
    } catch {
      // Ignore network errors
    }

    if (newCardData.syncToSheet) {
      handleSaveCardsToGoogleSheet([...cards, newCard]).catch(() => {});
    }
  };

  const handleAddTransaction = (newTxData: Omit<TransactionItem, 'id' | 'referenceId' | 'status'>) => {
    const newTx: TransactionItem = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      referenceId: `TXN-${newTxData.cardLast4}-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Thành công',
    };
    setTransactions((prev) => [newTx, ...prev]);

    try {
      const api = createApi();
      const catReverse: Record<string, string> = {
        tech: 'TECHNOLOGY',
        dining: 'FOOD',
        transport: 'TRANSPORT',
        housing: 'HOUSING',
        other: 'OTHER',
      };
      createTransaction(api, {
        cardId: newTxData.cardId,
        title: newTxData.merchant,
        amount: Math.abs(newTxData.amount),
        type: newTxData.type === 'expense' ? 'EXPENSE' : 'INCOME',
        category: catReverse[newTxData.category] || 'OTHER',
        note: 'Created via Web Dashboard',
      }).catch(() => {});
    } catch {
      // Network ignore
    }

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

  const handleToggleHideBalance = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      showToast(next ? '🔒 Đã ẩn số dư tài khoản' : '👁️ Đã hiển thị số dư tài khoản');
      return next;
    });
  };

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

  const getUserInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[parts.length - 2]?.[0] ?? '';
      const second = parts[parts.length - 1]?.[0] ?? '';
      return (first + second).toUpperCase() || 'CF';
    }
    return (parts[0]?.[0] ?? 'CF').toUpperCase();
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!txSearchQuery) return true;
    const q = txSearchQuery.toLowerCase().trim();
    const matchMerchant = tx.merchant.toLowerCase().includes(q);
    const matchCategory = tx.categoryLabel.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q);
    const matchCardLast4 = tx.cardLast4.includes(q);
    const matchRef = tx.referenceId.toLowerCase().includes(q);
    return matchMerchant || matchCategory || matchCardLast4 || matchRef;
  });

  const handleConnectGoogleDrive = () => {
    const w = 550, h = 650;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;
    window.open(
      'http://localhost:8080/cardflow-backend/v1/drive/actions/connect?redirect=true',
      'ConnectGoogleDrive',
      `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );
  };

  const handleSaveCardsToGoogleSheet = async (customCards?: CardDataModel[]) => {
    setIsSyncingToSheet(true);
    const targetCards = customCards || cards;
    try {
      const api = createApi();
      const state = typeof window !== 'undefined' ? localStorage.getItem('cardflow_google_state') || '' : '';
      const payload: SaveCardsToSheetInput = {
        state,
        cards: targetCards.map((c) => ({
          id: c.id,
          nickname: c.nickname,
          bankName: c.bankName,
          cardType: c.cardType,
          cardCategory: c.cardCategory || 'international',
          cardNetwork: c.cardNetwork || c.cardType,
          cardNumber: c.cardNumberFormatted || `•••• •••• •••• ${c.lastFourDigits}`,
          holderName: c.holderName || userProfile.fullName || 'LE HUYNH THUAN',
          expiryOrIssueDate: c.expiryDate || c.issueDate || '09/30',
          balance: c.balance,
          dailyLimit: c.dailyLimit,
          status: c.isLocked ? 'Đã khóa' : 'Hoạt động',
        })),
      };

      const res = await saveCardsToSheet(api, payload);
      setIsGoogleDriveConnected(true);
      if (res.spreadsheetUrl) {
        setLastSheetUrl(res.spreadsheetUrl);
      }
      showToast(`📊 Đã lưu thành công ${targetCards.length} thẻ vào Google Sheet!`);
      return res;
    } catch (err: any) {
      const errMsg = err?.message || err?.error || '';
      if (errMsg.includes('chưa được kết nối') || errMsg.includes('not connected')) {
        showToast('⚠️ Bạn chưa kết nối Google. Đang mở trang kết nối...');
        handleConnectGoogleDrive();
      } else {
        showToast(`❌ Không thể lưu thẻ vào Google Sheet: ${errMsg || 'Lỗi kết nối'}`);
      }
      throw err;
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  return {
    backendStatus,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    activeTab,
    setActiveTab,
    userProfile,
    cardsViewMode,
    cards,
    setCards,
    transactions,
    activeCardId,
    activeCard,
    showSensitiveData,
    decryptedSensitiveData,
    sensitiveCountdown,
    isVerifyPinModalOpen,
    setIsVerifyPinModalOpen,
    targetCardForPin,
    isBalanceHidden,
    txSearchQuery,
    setTxSearchQuery,
    isAddCardOpen,
    setIsAddCardOpen,
    isPinModalOpen,
    setIsPinModalOpen,
    isLimitModalOpen,
    setIsLimitModalOpen,
    isDetailCardModalOpen,
    setIsDetailCardModalOpen,
    selectedTxDetail,
    setSelectedTxDetail,
    isExportReportOpen,
    setIsExportReportOpen,
    toastMessage,
    showToast,
    isSyncingToSheet,
    lastSheetUrl,
    isGoogleDriveConnected,
    handleConnectGoogleDrive,
    handleSaveCardsToGoogleSheet,
    handleCardsViewModeChange,
    handleSelectCard,
    handleRequestToggleSensitive,
    handleVerifyPinSuccess,
    handleToggleLock,
    handleSetDefaultCard,
    handleToggleSecuritySetting,
    handleDeleteCard,
    handleUpdateCard,
    handleAddCard,
    handleAddTransaction,
    handleProfileSave,
    handleToggleHideBalance,
    getCardMiniGradient,
    getUserInitials,
    filteredTransactions,
  };
}
