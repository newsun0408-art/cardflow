import { useState } from 'react';
import {
  CloseOutlined,
  CopyOutlined,
  CheckOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  ShopOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { AddCardModal } from '@/app/_components/AddCardModal';
import { ChangePinModal } from '@/app/_components/ChangePinModal';
import { SetLimitModal } from '@/app/_components/SetLimitModal';
import { PersonalCard3D } from '@/app/_components/PersonalCard3D';
import { CardQuickControls } from '@/app/_components/CardQuickControls';
import { VerifyPinModal } from '@/app/_components/VerifyPinModal';
import { ExportReportModal } from '@/app/_components/ExportReportModal';
import { ImportSheetModal } from '@/app/_components/ImportSheetModal';
import { UserGuideModal } from '@/app/_components/UserGuideModal';
import type { CardDataModel, TransactionItem } from '../types';

interface DashboardModalsProps {
  isAddCardOpen: boolean;
  onCloseAddCard: () => void;
  onAddCard: (data: Omit<CardDataModel, 'id' | 'isLocked' | 'balance' | 'spentToday'>) => void;
  isPinModalOpen: boolean;
  onClosePinModal: () => void;
  onPinSuccess: () => void;
  isLimitModalOpen: boolean;
  activeCard?: CardDataModel | null;
  onCloseLimitModal: () => void;
  onSaveLimit: (newLimit: number) => void;
  isDetailCardModalOpen: boolean;
  onCloseDetailCardModal: () => void;
  showSensitiveData: boolean;
  decryptedSensitiveData: Record<string, { fullCardNumber: string; cvv: string }>;
  sensitiveCountdown: number;
  onToggleLock: (id: string) => void;
  onRequestToggleSensitive: (id: string, name: string) => void;
  onThemeChange: (theme: any) => void;
  selectedTxDetail: TransactionItem | null;
  onCloseTxDetail: () => void;
  onReportTxIssue: () => void;
  isVerifyPinModalOpen: boolean;
  targetCardForPin: { id: string; name: string } | null;
  onCloseVerifyPin: () => void;
  onVerifyPinSuccess: (result: { decryptedData?: { fullCardNumber: string; cvv: string }; expiresInSeconds?: number }) => void;
  isExportReportOpen: boolean;
  onCloseExportReport: () => void;
  exportTransactions: TransactionItem[];
  isImportSheetOpen?: boolean;
  onCloseImportSheet?: () => void;
  onOpenImportSheet?: () => void;
  onImportSuccess?: (transactions: TransactionItem[], targetCardId?: string) => void;
  cards?: CardDataModel[];
  onToast: (msg: string) => void;
  isGuideModalOpen?: boolean;
  onCloseGuideModal?: () => void;
}

export function DashboardModals({
  isAddCardOpen,
  onCloseAddCard,
  onAddCard,
  isPinModalOpen,
  onClosePinModal,
  onPinSuccess,
  isLimitModalOpen,
  activeCard,
  onCloseLimitModal,
  onSaveLimit,
  isDetailCardModalOpen,
  onCloseDetailCardModal,
  showSensitiveData,
  decryptedSensitiveData,
  sensitiveCountdown,
  onToggleLock,
  onRequestToggleSensitive,
  onThemeChange,
  selectedTxDetail,
  onCloseTxDetail,
  onReportTxIssue,
  isVerifyPinModalOpen,
  targetCardForPin,
  onCloseVerifyPin,
  onVerifyPinSuccess,
  isExportReportOpen,
  onCloseExportReport,
  exportTransactions,
  isImportSheetOpen = false,
  onCloseImportSheet,
  onOpenImportSheet,
  onImportSuccess,
  cards,
  onToast,
  isGuideModalOpen = false,
  onCloseGuideModal,
}: DashboardModalsProps) {
  const [hasCopiedRef, setHasCopiedRef] = useState(false);

  return (
    <>
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={onCloseAddCard}
        onAddCard={onAddCard}
      />

      <ChangePinModal
        isOpen={isPinModalOpen}
        onClose={onClosePinModal}
        onSuccess={onPinSuccess}
      />

      {activeCard && (
        <SetLimitModal
          isOpen={isLimitModalOpen}
          currentLimit={activeCard.dailyLimit}
          onClose={onCloseLimitModal}
          onSaveLimit={onSaveLimit}
        />
      )}

      {/* CARD DETAIL POPUP MODAL */}
      {isDetailCardModalOpen && activeCard && (
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
          onClick={onCloseDetailCardModal}
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
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>BẢNG CHI TIẾT THẺ CÁ NHÂN</span>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{activeCard.nickname}</h3>
              </div>
              <button
                onClick={onCloseDetailCardModal}
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

            <div style={{ maxWidth: '440px', margin: '0 auto 20px auto' }}>
              <PersonalCard3D
                theme={activeCard.theme}
                isLocked={activeCard.isLocked}
                showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
                onToggleLock={() => onToggleLock(activeCard.id)}
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

            <CardQuickControls
              currentTheme={activeCard.theme}
              isLocked={activeCard.isLocked}
              showSensitiveData={showSensitiveData && Boolean(decryptedSensitiveData[activeCard.id])}
              countdownSeconds={sensitiveCountdown}
              onToggleLock={() => onToggleLock(activeCard.id)}
              onToggleSensitiveData={() => onRequestToggleSensitive(activeCard.id, activeCard.nickname)}
              onOpenChangePin={() => {}}
              onOpenSetLimit={() => {}}
              onThemeChange={onThemeChange}
            />

            <button
              onClick={onCloseDetailCardModal}
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
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={onCloseTxDetail}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onCloseTxDetail}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Đóng"
            >
              <CloseOutlined style={{ fontSize: '13px' }} />
            </button>

            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  margin: '0 auto 10px auto',
                  borderRadius: '16px',
                  background:
                    selectedTxDetail.type === 'expense'
                      ? 'rgba(236, 72, 153, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color: selectedTxDetail.type === 'expense' ? '#f472b6' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                {selectedTxDetail.type === 'expense' ? '💸' : '💰'}
              </div>

              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Chi Tiết Giao Dịch
              </h3>

              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  color: selectedTxDetail.amount > 0 ? '#34d399' : '#f472b6',
                  margin: '6px 0',
                  letterSpacing: '-0.5px',
                }}
              >
                {selectedTxDetail.amount > 0 ? '+' : ''}
                {selectedTxDetail.amount.toLocaleString('vi-VN')} ₫
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  color: '#34d399',
                  fontWeight: 700,
                }}
              >
                ● {selectedTxDetail.status}
              </span>
            </div>

            {/* Detail rows */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShopOutlined /> Đơn vị chấp nhận
                </span>
                <span style={{ fontWeight: 700, color: '#ffffff', textAlign: 'right', maxWidth: '240px' }}>
                  {selectedTxDetail.merchant}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TagOutlined /> Danh mục
                </span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                  {selectedTxDetail.categoryLabel}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCardOutlined /> Thẻ thanh toán
                </span>
                <span style={{ fontWeight: 600, color: '#cbd5e1', fontFamily: 'monospace' }}>
                  •••• {selectedTxDetail.cardLast4}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarOutlined /> Thời gian GD
                </span>
                <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                  {selectedTxDetail.dateDisplay || selectedTxDetail.date} lúc {selectedTxDetail.time}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ color: '#94a3b8' }}>Mã GD</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 700, fontSize: '12px' }}>
                    {selectedTxDetail.referenceId}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(selectedTxDetail.referenceId);
                        setHasCopiedRef(true);
                        setTimeout(() => setHasCopiedRef(false), 2000);
                      }
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Sao chép mã giao dịch"
                  >
                    {hasCopiedRef ? <><CheckOutlined /> Đã chép</> : <><CopyOutlined /> Sao chép</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onReportTxIssue}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Báo Cáo Sai Sót
              </button>

              <button
                type="button"
                onClick={onCloseTxDetail}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)',
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
        cardId={targetCardForPin?.id || activeCard?.id || ''}
        cardName={targetCardForPin?.name || activeCard?.nickname || ''}
        onClose={onCloseVerifyPin}
        onSuccess={onVerifyPinSuccess}
      />

      {/* Export & Statement Report Preview Modal */}
      <ExportReportModal
        isOpen={isExportReportOpen}
        transactions={exportTransactions}
        holderName={activeCard?.holderName || 'LÊ HUỲNH THUẬN'}
        activeCardName={activeCard?.nickname || 'Tất cả các thẻ'}
        onClose={onCloseExportReport}
        onOpenImportSheet={onOpenImportSheet}
        onToast={onToast}
      />

      {/* Import Transactions from Google Sheet Modal */}
      {onCloseImportSheet && (
        <ImportSheetModal
          isOpen={isImportSheetOpen}
          cards={cards || (activeCard ? [activeCard] : [])}
          activeCardId={activeCard?.id || ''}
          onClose={onCloseImportSheet}
          onImportSuccess={onImportSuccess || (() => {})}
          onToast={onToast}
        />
      )}

      {/* User Feature Guide Modal */}
      <UserGuideModal
        isOpen={Boolean(isGuideModalOpen)}
        onClose={onCloseGuideModal || (() => {})}
      />
    </>
  );
}
