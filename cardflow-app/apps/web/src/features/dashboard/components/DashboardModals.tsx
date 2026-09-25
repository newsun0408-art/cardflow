'use client';

import { CloseOutlined } from '@ant-design/icons';
import { AddCardModal } from '@/app/_components/AddCardModal';
import { ChangePinModal } from '@/app/_components/ChangePinModal';
import { SetLimitModal } from '@/app/_components/SetLimitModal';
import { PersonalCard3D } from '@/app/_components/PersonalCard3D';
import { CardQuickControls } from '@/app/_components/CardQuickControls';
import { VerifyPinModal } from '@/app/_components/VerifyPinModal';
import { ExportReportModal } from '@/app/_components/ExportReportModal';
import { ImportSheetModal } from '@/app/_components/ImportSheetModal';
import type { CardDataModel, TransactionItem } from '../types';

interface DashboardModalsProps {
  isAddCardOpen: boolean;
  onCloseAddCard: () => void;
  onAddCard: (data: Omit<CardDataModel, 'id' | 'isLocked' | 'balance' | 'spentToday'>) => void;
  isPinModalOpen: boolean;
  onClosePinModal: () => void;
  onPinSuccess: () => void;
  isLimitModalOpen: boolean;
  activeCard: CardDataModel;
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
}: DashboardModalsProps) {
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

      <SetLimitModal
        isOpen={isLimitModalOpen}
        currentLimit={activeCard.dailyLimit}
        onClose={onCloseLimitModal}
        onSaveLimit={onSaveLimit}
      />

      {/* CARD DETAIL POPUP MODAL */}
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
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={onCloseTxDetail}
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
            onClick={(e) => e.stopPropagation()}
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
                onClick={onReportTxIssue}
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
                onClick={onCloseTxDetail}
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
        onClose={onCloseVerifyPin}
        onSuccess={onVerifyPinSuccess}
      />

      {/* Export & Statement Report Preview Modal */}
      <ExportReportModal
        isOpen={isExportReportOpen}
        transactions={exportTransactions}
        holderName={activeCard.holderName}
        activeCardName={activeCard.nickname}
        onClose={onCloseExportReport}
        onOpenImportSheet={onOpenImportSheet}
        onToast={onToast}
      />

      {/* Import Transactions from Google Sheet Modal */}
      {onCloseImportSheet && (
        <ImportSheetModal
          isOpen={isImportSheetOpen}
          cards={cards || [activeCard]}
          activeCardId={activeCard.id}
          onClose={onCloseImportSheet}
          onImportSuccess={onImportSuccess || (() => {})}
          onToast={onToast}
        />
      )}
    </>
  );
}
