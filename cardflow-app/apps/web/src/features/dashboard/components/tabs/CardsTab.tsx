'use client';

import { useState } from 'react';
import {
  AppstoreOutlined,
  TableOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  StarOutlined,
  CreditCardOutlined,
  EditOutlined,
  CheckOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { CardDataModel, CardsViewMode } from '../../types';
import type { CardTheme } from '@/app/_components/PersonalCard3D';

interface CardsTabProps {
  cards: CardDataModel[];
  activeCardId: string;
  cardsViewMode: CardsViewMode;
  onCardsViewModeChange: (mode: CardsViewMode) => void;
  onOpenAddCard: () => void;
  onSelectCard: (id: string, openDetail?: boolean) => void;
  onSetDefaultCard: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onDeleteCard?: (id: string) => void;
  onUpdateCard?: (id: string, updatedFields: Partial<CardDataModel>) => void;
  getCardMiniGradient: (theme: CardTheme) => string;
  isBalanceHidden: boolean;
  onSaveToGoogleSheet?: (selectedCards?: CardDataModel[]) => void;
  isSyncingToSheet?: boolean;
  lastSheetUrl?: string | null;
  isGoogleDriveConnected?: boolean;
  onConnectGoogleDrive?: () => void;
}

export function CardsTab({
  cards,
  activeCardId,
  cardsViewMode,
  onCardsViewModeChange,
  onOpenAddCard,
  onSelectCard,
  onSetDefaultCard,
  onToggleLock: _onToggleLock,
  onDeleteCard: _onDeleteCard,
  onUpdateCard,
  getCardMiniGradient,
  isBalanceHidden,
  onSaveToGoogleSheet,
  isSyncingToSheet,
  lastSheetUrl,
  isGoogleDriveConnected,
  onConnectGoogleDrive,
}: CardsTabProps) {
  // State chỉnh sửa thẻ
  const [editingCard, setEditingCard] = useState<CardDataModel | null>(null);
  const [editForm, setEditForm] = useState<{
    nickname: string;
    holderName: string;
    bankName: string;
    dailyLimit: number;
    theme: CardTheme;
    onlinePayment: boolean;
    internationalPayment: boolean;
    atmWithdrawal: boolean;
    notificationsEnabled: boolean;
  }>({
    nickname: '',
    holderName: '',
    bankName: '',
    dailyLimit: 50000000,
    theme: 'dark-cyber',
    onlinePayment: true,
    internationalPayment: true,
    atmWithdrawal: true,
    notificationsEnabled: true,
  });

  const handleOpenEditModal = (card: CardDataModel) => {
    setEditingCard(card);
    setEditForm({
      nickname: card.nickname || '',
      holderName: card.holderName || '',
      bankName: card.bankName || '',
      dailyLimit: card.dailyLimit || 50000000,
      theme: card.theme || 'dark-cyber',
      onlinePayment: card.onlinePayment ?? true,
      internationalPayment: card.internationalPayment ?? true,
      atmWithdrawal: card.atmWithdrawal ?? true,
      notificationsEnabled: card.notificationsEnabled ?? true,
    });
  };

  const handleSaveEdit = () => {
    if (!editingCard) return;
    if (onUpdateCard) {
      onUpdateCard(editingCard.id, {
        nickname: editForm.nickname.trim() || editingCard.nickname,
        holderName: editForm.holderName.trim().toUpperCase() || editingCard.holderName,
        bankName: editForm.bankName.trim() || editingCard.bankName,
        dailyLimit: Number(editForm.dailyLimit) || editingCard.dailyLimit,
        theme: editForm.theme,
        onlinePayment: editForm.onlinePayment,
        internationalPayment: editForm.internationalPayment,
        atmWithdrawal: editForm.atmWithdrawal,
        notificationsEnabled: editForm.notificationsEnabled,
      });
    }
    setEditingCard(null);
  };
  // State quản lý việc chọn thẻ để lưu vào Google Sheet
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isCardSelectModalOpen, setIsCardSelectModalOpen] = useState(false);

  // Toggle tick / bỏ tick 1 thẻ
  const toggleCardSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn tất cả hoặc bỏ chọn tất cả
  const handleSelectAllCards = () => {
    if (selectedCardIds.length === cards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(cards.map((c) => c.id));
    }
  };

  // Thực hiện lưu thẻ đã tick vào Google Sheet
  const handleTriggerSave = (cardsToSave?: CardDataModel[]) => {
    const target = cardsToSave || (selectedCardIds.length > 0 ? cards.filter((c) => selectedCardIds.includes(c.id)) : []);
    if (target.length === 0) {
      // Nếu chưa tick thẻ nào, mở modal chọn thẻ trực quan
      setIsCardSelectModalOpen(true);
      return;
    }
    if (!isGoogleDriveConnected && onConnectGoogleDrive) {
      onConnectGoogleDrive();
    } else if (onSaveToGoogleSheet) {
      onSaveToGoogleSheet(target);
    }
  };

  return (
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
              onClick={() => onCardsViewModeChange('grid')}
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
              onClick={() => onCardsViewModeChange('table')}
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
              onClick={() => onCardsViewModeChange('list')}
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

          {/* Nút Chọn Thẻ cần lưu */}
          <button
            onClick={() => setIsCardSelectModalOpen(true)}
            title="Chọn các thẻ bạn muốn lưu vào Google Sheet"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: selectedCardIds.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: selectedCardIds.length > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: selectedCardIds.length > 0 ? '#34d399' : '#e2e8f0',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: selectedCardIds.length > 0 ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
            }}
          >
            <CheckSquareOutlined style={{ fontSize: '15px' }} />
            <span>
              {selectedCardIds.length > 0
                ? `Đã chọn (${selectedCardIds.length}/${cards.length})`
                : 'Chọn thẻ'}
            </span>
          </button>

          {/* Nút Lưu thông tin thẻ vào Google Sheet */}
          <button
            onClick={() => handleTriggerSave()}
            disabled={isSyncingToSheet}
            title={
              selectedCardIds.length > 0
                ? `Lưu ${selectedCardIds.length} thẻ đã tick vào Google Sheet`
                : isGoogleDriveConnected
                ? 'Lưu thẻ vào Google Sheet trong thư mục CardFlow'
                : 'Kết nối Google Drive & Sheets để lưu danh sách thẻ'
            }
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: isGoogleDriveConnected
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
              color: '#ffffff',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSyncingToSheet ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <span>
              {isSyncingToSheet
                ? '⏳ Đang lưu...'
                : selectedCardIds.length > 0
                ? `📊 Lưu ${selectedCardIds.length} thẻ vào Google Sheet`
                : '📊 Lưu vào Google Sheet'}
            </span>
            {isGoogleDriveConnected && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 6px #4ade80',
                }}
                title="Google Drive đã kết nối"
              />
            )}
          </button>

          {lastSheetUrl && (
            <a
              href={lastSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở Google Sheet đã lưu"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                fontWeight: 600,
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              <span>Mở Sheet ↗</span>
            </a>
          )}

          <button
            onClick={onOpenAddCard}
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

      {/* Banner thông báo khi đang chọn thẻ */}
      {selectedCardIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '14px',
            padding: '12px 20px',
            color: '#f8fafc',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
              }}
            >
              {selectedCardIds.length}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              Đang chọn <strong style={{ color: '#34d399' }}>{selectedCardIds.length}</strong> / {cards.length} thẻ. Bạn tick vào thẻ nào thì hệ thống sẽ chỉ lưu thẻ đó vào Google Sheet.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleSelectAllCards}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {selectedCardIds.length === cards.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả thẻ'}
            </button>

            <button
              onClick={() => handleTriggerSave()}
              disabled={isSyncingToSheet}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              }}
            >
              Lưu {selectedCardIds.length} thẻ ngay ↗
            </button>
          </div>
        </div>
      )}

      {/* DẠNG 1: LƯỚI (GRID VIEW) */}
      {cardsViewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {cards.map((card) => {
            const isSelected = card.id === activeCardId;
            const isCardChecked = selectedCardIds.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => onSelectCard(card.id, true)}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: isCardChecked
                    ? '2px solid #10b981'
                    : isSelected
                    ? '2px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '24px',
                  paddingTop: '28px',
                  boxShadow: isCardChecked
                    ? '0 0 25px rgba(16, 185, 129, 0.3)'
                    : isSelected
                    ? '0 0 25px rgba(56, 189, 248, 0.25)'
                    : '0 10px 30px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="my-card-grid-item"
              >
                {/* Checkbox chọn thẻ để lưu Google Sheet */}
                <div
                  onClick={(e) => toggleCardSelection(card.id, e)}
                  title={isCardChecked ? 'Bỏ chọn thẻ này' : 'Tick để chọn lưu thẻ này vào Google Sheet'}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '7px',
                    border: isCardChecked ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.35)',
                    background: isCardChecked ? '#10b981' : 'rgba(15, 23, 42, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.15s ease',
                    boxShadow: isCardChecked ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                  }}
                >
                  {isCardChecked && <CheckOutlined style={{ color: '#ffffff', fontSize: '12px', fontWeight: 900 }} />}
                </div>

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
                      <div style={{ color: '#4ade80', fontWeight: 700 }}>⚡ Hoạt động</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCard(card.id, true);
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
                        onSetDefaultCard(card.id);
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
                      handleOpenEditModal(card);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)')}
                  >
                    <EditOutlined style={{ color: '#38bdf8' }} />
                    <span>Chỉnh sửa</span>
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
                  <th style={{ width: '48px', padding: '14px 16px', textAlign: 'center' }}>
                    <div
                      onClick={handleSelectAllCards}
                      title={selectedCardIds.length === cards.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả thẻ'}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '5px',
                        border: selectedCardIds.length > 0 ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.35)',
                        background: selectedCardIds.length > 0 ? '#10b981' : 'transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {selectedCardIds.length > 0 && <CheckOutlined style={{ color: '#ffffff', fontSize: '11px', fontWeight: 900 }} />}
                    </div>
                  </th>
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
                  const isCardChecked = selectedCardIds.includes(card.id);
                  return (
                    <tr
                      key={card.id}
                      onClick={() => onSelectCard(card.id, true)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        background: isCardChecked
                          ? 'rgba(16, 185, 129, 0.1)'
                          : isSelected
                          ? 'rgba(56, 189, 248, 0.08)'
                          : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isCardChecked) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isCardChecked) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ width: '48px', padding: '16px', textAlign: 'center' }} onClick={(e) => toggleCardSelection(card.id, e)}>
                        <div
                          title={isCardChecked ? 'Bỏ chọn thẻ này' : 'Tick để chọn lưu thẻ này vào Google Sheet'}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            border: isCardChecked ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.35)',
                            background: isCardChecked ? '#10b981' : 'transparent',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          {isCardChecked && <CheckOutlined style={{ color: '#ffffff', fontSize: '11px', fontWeight: 900 }} />}
                        </div>
                      </td>

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
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                          }}
                        >
                          ⚡ Hoạt động
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectCard(card.id, true)}
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
                              onClick={() => onSetDefaultCard(card.id)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(card);
                            }}
                            title="Chỉnh sửa thông tin thẻ"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38bdf8',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <EditOutlined style={{ color: '#38bdf8' }} />
                            <span>Sửa</span>
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
            const isCardChecked = selectedCardIds.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => onSelectCard(card.id, true)}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: isCardChecked
                    ? '2px solid #10b981'
                    : isSelected
                    ? '2px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: isCardChecked
                    ? '0 0 20px rgba(16, 185, 129, 0.25)'
                    : isSelected
                    ? '0 0 20px rgba(56, 189, 248, 0.2)'
                    : '0 4px 20px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px' }}>
                  {/* Checkbox chọn thẻ để lưu Google Sheet */}
                  <div
                    onClick={(e) => toggleCardSelection(card.id, e)}
                    title={isCardChecked ? 'Bỏ chọn thẻ này' : 'Tick để chọn lưu thẻ này vào Google Sheet'}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '7px',
                      border: isCardChecked ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.35)',
                      background: isCardChecked ? '#10b981' : 'rgba(15, 23, 42, 0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      boxShadow: isCardChecked ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                    }}
                  >
                    {isCardChecked && <CheckOutlined style={{ color: '#ffffff', fontSize: '13px', fontWeight: 900 }} />}
                  </div>

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
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80',
                      }}
                    >
                      ⚡ Hoạt động
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectCard(card.id, true)}
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
                      onClick={() => onSetDefaultCard(card.id)}
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
                      handleOpenEditModal(card);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <EditOutlined style={{ color: '#38bdf8' }} />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CHỌN THẺ CẦN LƯU VÀO GOOGLE SHEET */}
      {isCardSelectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={() => setIsCardSelectModalOpen(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30, 41, 59, 0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '20px',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <FileExcelOutlined />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    Chọn Thẻ Cần Lưu Vào Google Sheet
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Tick chọn thẻ bạn muốn lưu (chọn 1 lưu 1, chọn 2 lưu 2...)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCardSelectModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Select All Controls */}
            <div
              style={{
                padding: '12px 24px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Đã chọn: <strong style={{ color: '#34d399', fontSize: '15px' }}>{selectedCardIds.length}</strong> / {cards.length} thẻ
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedCardIds(cards.map((c) => c.id))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Chọn tất cả
                </button>
                <button
                  onClick={() => setSelectedCardIds([])}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Card List in Modal */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cards.map((card) => {
                const isChecked = selectedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleCardSelection(card.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                      border: isChecked ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: isChecked ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.3)',
                          background: isChecked ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <CheckOutlined style={{ color: '#ffffff', fontSize: '12px' }} />}
                      </div>

                      <div
                        style={{
                          width: '42px',
                          height: '28px',
                          borderRadius: '6px',
                          background: getCardMiniGradient(card.theme),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '14px',
                          flexShrink: 0,
                        }}
                      >
                        <CreditCardOutlined />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>{card.nickname}</span>
                          {card.isDefault && (
                            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {card.bankName} • <span style={{ fontFamily: 'monospace' }}>•••• {card.lastFourDigits}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {card.dailyLimit.toLocaleString('vi-VN')} ₫
                      </div>
                      <div style={{ fontSize: '11px', color: '#4ade80' }}>
                        ⚡ Hoạt động
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                background: 'rgba(30, 41, 59, 0.4)',
              }}
            >
              <button
                onClick={() => setIsCardSelectModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>

              <button
                onClick={() => {
                  const chosen = cards.filter((c) => selectedCardIds.includes(c.id));
                  if (chosen.length > 0) {
                    setIsCardSelectModalOpen(false);
                    handleTriggerSave(chosen);
                  }
                }}
                disabled={selectedCardIds.length === 0 || isSyncingToSheet}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: selectedCardIds.length > 0
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: selectedCardIds.length > 0 ? '#ffffff' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: selectedCardIds.length > 0 && !isSyncingToSheet ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: selectedCardIds.length > 0 ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                }}
              >
                <span>
                  {isSyncingToSheet
                    ? '⏳ Đang lưu...'
                    : `📊 Lưu ${selectedCardIds.length} thẻ đã chọn vào Google Sheet`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA THẺ */}
      {editingCard && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px',
          }}
          onClick={() => setEditingCard(null)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30, 41, 59, 0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '20px',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                  }}
                >
                  <EditOutlined />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    Chỉnh Sửa Thông Tin Thẻ
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Cập nhật tên gợi nhớ, ngân hàng, hạn mức và giao diện thẻ
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Form Body */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Tên gợi nhớ */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  TÊN GỢI NHỚ THẺ
                </label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nickname: e.target.value }))}
                  placeholder="VD: Thẻ Chi Tiêu Chính, Thẻ Titanium..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Chủ thẻ & Ngân hàng */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    CHỦ THẺ
                  </label>
                  <input
                    type="text"
                    value={editForm.holderName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                    placeholder="VD: LE HUYNH THUAN"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    NGÂN HÀNG PHÁT HÀNH
                  </label>
                  <select
                    value={editForm.bankName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    {[
                      'Vietcombank',
                      'Techcombank',
                      'MB Bank',
                      'ACB',
                      'BIDV',
                      'VietinBank',
                      'Sacombank',
                      'VPBank',
                      'TPBank',
                      'OCB',
                      'SHB',
                      'HDBank',
                      'SeABank',
                      'Agribank',
                      'Nam A Bank',
                      'Cardflow Bank',
                    ].map((bank) => (
                      <option key={bank} value={bank} style={{ background: '#1e293b', color: '#ffffff' }}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hạn mức ngày */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  HẠN MỨC CHI TIÊU / NGÀY (VNĐ)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="500000"
                    min="1000000"
                    value={editForm.dailyLimit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, dailyLimit: Number(e.target.value) }))}
                    placeholder="50000000"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      paddingRight: '60px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#34d399',
                      fontSize: '15px',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '13px',
                      color: '#94a3b8',
                      fontWeight: 700,
                    }}
                  >
                    ₫ / ngày
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Hạn mức hiện tại: {editForm.dailyLimit ? editForm.dailyLimit.toLocaleString('vi-VN') : 0} VNĐ
                </div>
              </div>

              {/* Giao diện thẻ (Card Theme) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  GIAO DIỆN THẺ (CHỦ ĐỀ)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'dark-cyber', label: 'Dark Cyber', grad: 'linear-gradient(135deg, #090d16, #0284c7)' },
                    { id: 'gold-luxe', label: 'Gold Luxe VIP', grad: 'linear-gradient(135deg, #b45309, #f59e0b)' },
                    { id: 'deep-sapphire', label: 'Deep Sapphire', grad: 'linear-gradient(135deg, #0369a1, #38bdf8)' },
                    { id: 'crimson-ruby', label: 'Crimson Ruby', grad: 'linear-gradient(135deg, #be123c, #fb7185)' },
                    { id: 'holographic', label: 'Holographic', grad: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
                    { id: 'gold-elegance', label: 'Gold Elegance', grad: 'linear-gradient(135deg, #d4af37, #78350f)' },
                  ].map((themeOpt) => {
                    const isSelected = editForm.theme === themeOpt.id;
                    return (
                      <button
                        key={themeOpt.id}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, theme: themeOpt.id as CardTheme }))}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '24px',
                            borderRadius: '6px',
                            background: themeOpt.grad,
                            boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#38bdf8' : '#cbd5e1',
                          }}
                        >
                          {themeOpt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tính năng bảo mật */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  CÀI ĐẶT BẢO MẬT & TÍNH NĂNG
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { key: 'onlinePayment', label: 'Thanh toán Online', value: editForm.onlinePayment },
                    { key: 'internationalPayment', label: 'Thanh toán Quốc tế', value: editForm.internationalPayment },
                    { key: 'atmWithdrawal', label: 'Rút tiền ATM', value: editForm.atmWithdrawal },
                    { key: 'notificationsEnabled', label: 'Nhận thông báo', value: editForm.notificationsEnabled },
                  ].map((setting) => (
                    <button
                      key={setting.key}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          [setting.key]: !prev[setting.key as keyof typeof editForm],
                        }))
                      }
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: setting.value ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: setting.value ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: setting.value ? '#4ade80' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{setting.label}</span>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: setting.value ? '#22c55e' : 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '10px',
                        }}
                      >
                        {setting.value && <CheckOutlined />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                background: 'rgba(30, 41, 59, 0.4)',
              }}
            >
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                }}
              >
                <CheckOutlined />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
