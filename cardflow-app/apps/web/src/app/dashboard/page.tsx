'use client';

import { CheckCircleFilled } from '@ant-design/icons';
import {
  useDashboardState,
  DashboardSidebar,
  DashboardHeader,
  OverviewTab,
  CardsTab,
  DashboardModals,
} from '@/features/dashboard';
import { TransactionExpenseManager } from '@/app/_components/TransactionExpenseManager';
import { AppSettingsHub } from '@/app/_components/AppSettingsHub';

export default function FullscreenDashboard() {
  const {
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
    isImportSheetOpen,
    setIsImportSheetOpen,
    handleImportTransactionsSuccess,
    toastMessage,
    showToast,
    isSyncingToSheet,
    isDeletingCardsSheet,
    lastSheetUrl,
    isGoogleDriveConnected,
    handleConnectGoogleDrive,
    handleSaveCardsToGoogleSheet,
    handleDeleteCardsSheet,
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
  } = useDashboardState();

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

      {/* 1. Collapsible Left Sidebar */}
      <DashboardSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Full-Screen Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar Header */}
        <DashboardHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cardsCount={cards.length}
          backendStatus={backendStatus}
          txSearchQuery={txSearchQuery}
          setTxSearchQuery={setTxSearchQuery}
          isBalanceHidden={isBalanceHidden}
          onToggleHideBalance={handleToggleHideBalance}
          onOpenAddCard={() => setIsAddCardOpen(true)}
          userProfile={userProfile}
          getUserInitials={getUserInitials}
        />

        {/* Tab Contents */}
        <main style={{ padding: '28px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <OverviewTab
              cards={cards}
              activeCard={activeCard}
              activeCardId={activeCardId}
              onSelectCard={handleSelectCard}
              onOpenAddCard={() => setIsAddCardOpen(true)}
              onToggleLock={handleToggleLock}
              onDeleteCard={handleDeleteCard}
              onRequestToggleSensitive={handleRequestToggleSensitive}
              showSensitiveData={showSensitiveData}
              decryptedSensitiveData={decryptedSensitiveData}
              sensitiveCountdown={sensitiveCountdown}
              onOpenChangePin={() => setIsPinModalOpen(true)}
              onOpenSetLimit={() => setIsLimitModalOpen(true)}
              onUpdateCardTheme={(cardId, theme) => {
                setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, theme } : c)));
              }}
              onToggleSecuritySetting={handleToggleSecuritySetting}
              filteredTransactions={filteredTransactions}
              onOpenTxDetail={(tx) => setSelectedTxDetail(tx)}
              onGoToTransactions={() => setActiveTab('transactions')}
              isBalanceHidden={isBalanceHidden}
              onToggleHideBalance={handleToggleHideBalance}
              onSaveToGoogleSheet={() => handleSaveCardsToGoogleSheet()}
              isSyncingToSheet={isSyncingToSheet}
              lastSheetUrl={lastSheetUrl}
              isGoogleDriveConnected={isGoogleDriveConnected}
            />
          )}

          {/* Tab 2: Cards */}
          {activeTab === 'cards' && (
            <CardsTab
              cards={cards}
              activeCardId={activeCardId}
              cardsViewMode={cardsViewMode}
              onCardsViewModeChange={handleCardsViewModeChange}
              onOpenAddCard={() => setIsAddCardOpen(true)}
              onSelectCard={handleSelectCard}
              onSetDefaultCard={handleSetDefaultCard}
              onToggleLock={handleToggleLock}
              onDeleteCard={handleDeleteCard}
              onUpdateCard={handleUpdateCard}
              getCardMiniGradient={getCardMiniGradient}
              isBalanceHidden={isBalanceHidden}
              onSaveToGoogleSheet={(selectedCards) => handleSaveCardsToGoogleSheet(selectedCards)}
              isSyncingToSheet={isSyncingToSheet}
              lastSheetUrl={lastSheetUrl}
              onDeleteCardsSheet={handleDeleteCardsSheet}
              isDeletingCardsSheet={isDeletingCardsSheet}
              isGoogleDriveConnected={isGoogleDriveConnected}
              onConnectGoogleDrive={handleConnectGoogleDrive}
            />
          )}

          {/* Tab 3 & 4: Transactions & Stats */}
          {(activeTab === 'transactions' || activeTab === 'stats') && (
            <TransactionExpenseManager
              transactions={transactions}
              cards={cards}
              isBalanceHidden={isBalanceHidden}
              onToggleBalance={handleToggleHideBalance}
              onAddTransaction={handleAddTransaction}
              onOpenExportReport={() => setIsExportReportOpen(true)}
              onOpenImportSheet={() => setIsImportSheetOpen(true)}
              onToast={showToast}
            />
          )}

          {/* Tab 5: Settings */}
          {activeTab === 'settings' && (
            <AppSettingsHub
              userProfile={userProfile}
              onProfileSave={handleProfileSave}
              isBalanceHidden={isBalanceHidden}
              onToggleBalance={handleToggleHideBalance}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* 3. Modals & Popups */}
      <DashboardModals
        isAddCardOpen={isAddCardOpen}
        onCloseAddCard={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
        isPinModalOpen={isPinModalOpen}
        onClosePinModal={() => setIsPinModalOpen(false)}
        onPinSuccess={() => showToast('🔑 Đổi mã PIN thẻ thành công')}
        isLimitModalOpen={isLimitModalOpen}
        activeCard={activeCard}
        onCloseLimitModal={() => setIsLimitModalOpen(false)}
        onSaveLimit={(newLimit) => {
          setCards((prev) =>
            prev.map((c) => (c.id === activeCard.id ? { ...c, dailyLimit: newLimit } : c))
          );
          showToast(`📊 Đã cập nhật hạn mức ngày: ${newLimit.toLocaleString('vi-VN')} ₫`);
        }}
        isDetailCardModalOpen={isDetailCardModalOpen}
        onCloseDetailCardModal={() => setIsDetailCardModalOpen(false)}
        showSensitiveData={showSensitiveData}
        decryptedSensitiveData={decryptedSensitiveData}
        sensitiveCountdown={sensitiveCountdown}
        onToggleLock={handleToggleLock}
        onRequestToggleSensitive={handleRequestToggleSensitive}
        onThemeChange={(newTheme) => {
          setCards((prev) =>
            prev.map((c) => (c.id === activeCard.id ? { ...c, theme: newTheme } : c))
          );
        }}
        selectedTxDetail={selectedTxDetail}
        onCloseTxDetail={() => setSelectedTxDetail(null)}
        onReportTxIssue={() => {
          showToast('📩 Đã gửi báo cáo sai sót giao dịch đến bộ phận hỗ trợ');
          setSelectedTxDetail(null);
        }}
        isVerifyPinModalOpen={isVerifyPinModalOpen}
        targetCardForPin={targetCardForPin}
        onCloseVerifyPin={() => setIsVerifyPinModalOpen(false)}
        onVerifyPinSuccess={handleVerifyPinSuccess}
        isExportReportOpen={isExportReportOpen}
        onCloseExportReport={() => setIsExportReportOpen(false)}
        exportTransactions={filteredTransactions.length > 0 ? filteredTransactions : transactions}
        isImportSheetOpen={isImportSheetOpen}
        onCloseImportSheet={() => setIsImportSheetOpen(false)}
        onOpenImportSheet={() => setIsImportSheetOpen(true)}
        onImportSuccess={handleImportTransactionsSuccess}
        cards={cards}
        onToast={showToast}
      />
    </div>
  );
}
