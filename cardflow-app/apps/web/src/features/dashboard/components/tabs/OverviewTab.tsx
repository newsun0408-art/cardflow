'use client';

import {
  CreditCardOutlined,
  DeleteOutlined,
  CoffeeOutlined,
  ShoppingOutlined,
  CarOutlined,
  LaptopOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { PersonalCard3D } from '@/app/_components/PersonalCard3D';
import { CardQuickControls } from '@/app/_components/CardQuickControls';
import { CardBalanceCard } from '@/app/_components/CardBalanceCard';
import type { CardDataModel, TransactionItem } from '../../types';

interface OverviewTabProps {
  cards: CardDataModel[];
  activeCard: CardDataModel;
  activeCardId: string;
  onSelectCard: (id: string) => void;
  onOpenAddCard: () => void;
  onToggleLock?: (id: string) => void;
  onDeleteCard?: (id: string) => void;
  onRequestToggleSensitive: (id: string, name: string) => void;
  showSensitiveData: boolean;
  decryptedSensitiveData: Record<string, { fullCardNumber: string; cvv: string }>;
  sensitiveCountdown: number;
  onOpenChangePin: () => void;
  onOpenSetLimit: () => void;
  onUpdateCardTheme: (cardId: string, theme: any) => void;
  onToggleSecuritySetting: (cardId: string, key: 'onlinePayment' | 'internationalPayment') => void;
  filteredTransactions: TransactionItem[];
  onOpenTxDetail: (tx: TransactionItem) => void;
  onGoToTransactions: () => void;
  isBalanceHidden: boolean;
  onToggleHideBalance: () => void;
  onSaveToGoogleSheet?: () => void;
  isSyncingToSheet?: boolean;
  lastSheetUrl?: string | null;
  isGoogleDriveConnected?: boolean;
}

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

export function OverviewTab({
  cards,
  activeCard,
  activeCardId,
  onSelectCard,
  onOpenAddCard,
  onToggleLock,
  onDeleteCard,
  onRequestToggleSensitive,
  showSensitiveData,
  decryptedSensitiveData,
  sensitiveCountdown,
  onOpenChangePin,
  onOpenSetLimit,
  onUpdateCardTheme,
  onToggleSecuritySetting,
  filteredTransactions,
  onOpenTxDetail,
  onGoToTransactions,
  isBalanceHidden,
  onToggleHideBalance,
  onSaveToGoogleSheet,
  isSyncingToSheet,
  lastSheetUrl,
  isGoogleDriveConnected,
}: OverviewTabProps) {
  return (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCardOutlined style={{ color: '#38bdf8' }} /> Danh Sách Thẻ Cá Nhân ({cards.length})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {onSaveToGoogleSheet && (
                <button
                  onClick={onSaveToGoogleSheet}
                  disabled={isSyncingToSheet}
                  title="Lưu danh sách thẻ vào Google Sheet"
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    padding: '4px 10px',
                    cursor: isSyncingToSheet ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{isSyncingToSheet ? '⏳ Đang lưu...' : '📊 Lưu vào Sheet'}</span>
                  {isGoogleDriveConnected && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                  )}
                </button>
              )}
              {lastSheetUrl && (
                <a
                  href={lastSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Mở Sheet ↗
                </a>
              )}
              <button onClick={onOpenAddCard} style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                + Thêm thẻ mới
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
            {cards.map((card) => {
              const isActive = card.id === activeCardId;
              return (
                <div
                  key={card.id}
                  onClick={() => onSelectCard(card.id)}
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

            {onDeleteCard && (
              <button
                type="button"
                onClick={() => onDeleteCard(activeCard.id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                }}
              >
                <DeleteOutlined style={{ color: '#ef4444' }} />
                <span>Xóa Thẻ Này</span>
              </button>
            )}
          </div>

          <div style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
            <PersonalCard3D
              theme={activeCard.theme}
              isLocked={false}
              showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
              onToggleLock={() => onToggleLock?.(activeCard.id)}
              onToggleSensitiveData={() => onRequestToggleSensitive(activeCard.id, activeCard.nickname)}
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
            isLocked={false}
            showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
            countdownSeconds={sensitiveCountdown}
            onDeleteCard={() => onDeleteCard?.(activeCard.id)}
            onToggleSensitiveData={() => onRequestToggleSensitive(activeCard.id, activeCard.nickname)}
            onOpenChangePin={onOpenChangePin}
            onOpenSetLimit={onOpenSetLimit}
            onThemeChange={(newTheme) => onUpdateCardTheme(activeCard.id, newTheme)}
          />

          {/* Security Toggles */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', textAlign: 'left' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Thanh toán Online</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Thanh toán TMĐT</div>
              </div>
              <input type="checkbox" checked={activeCard.onlinePayment} onChange={() => onToggleSecuritySetting(activeCard.id, 'onlinePayment')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Thanh toán Quốc tế</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Giao dịch nước ngoài</div>
              </div>
              <input type="checkbox" checked={activeCard.internationalPayment} onChange={() => onToggleSecuritySetting(activeCard.id, 'internationalPayment')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* Transactions Feed */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>Giao Dịch Gần Đây</div>
            <button onClick={onGoToTransactions} style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Xem tất cả →</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTransactions.slice(0, 4).map((tx) => (
              <div key={tx.id} onClick={() => onOpenTxDetail(tx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', cursor: 'pointer' }}>
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
          onToggleHideBalance={onToggleHideBalance}
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
      </div>
    </div>
  );
}
