'use client';

import {
  AppstoreOutlined,
  TableOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  StarOutlined,
  CreditCardOutlined,
  DeleteOutlined,
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
  onToggleLock: (id: string) => void;
  onDeleteCard: (id: string) => void;
  getCardMiniGradient: (theme: CardTheme) => string;
  isBalanceHidden: boolean;
  onSaveToGoogleSheet?: () => void;
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
  onToggleLock,
  onDeleteCard,
  getCardMiniGradient,
  isBalanceHidden,
  onSaveToGoogleSheet,
  isSyncingToSheet,
  lastSheetUrl,
  isGoogleDriveConnected,
  onConnectGoogleDrive,
}: CardsTabProps) {
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

          {/* Nút Lưu thông tin thẻ vào Google Sheet */}
          <button
            onClick={() => {
              if (!isGoogleDriveConnected && onConnectGoogleDrive) {
                onConnectGoogleDrive();
              } else if (onSaveToGoogleSheet) {
                onSaveToGoogleSheet();
              }
            }}
            disabled={isSyncingToSheet}
            title={isGoogleDriveConnected ? "Lưu toàn bộ danh sách thẻ vào Google Sheet trong thư mục CardFlow" : "Kết nối Google Drive & Sheets để lưu danh sách thẻ"}
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
            <span>{isSyncingToSheet ? '⏳ Đang lưu...' : '📊 Lưu vào Google Sheet'}</span>
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

      {/* DẠNG 1: LƯỚI (GRID VIEW) */}
      {cardsViewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {cards.map((card) => {
            const isSelected = card.id === activeCardId;
            return (
              <div
                key={card.id}
                onClick={() => onSelectCard(card.id, true)}
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
                      onDeleteCard(card.id);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                  >
                    <DeleteOutlined style={{ color: '#ef4444' }} />
                    <span>Xóa thẻ</span>
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
                      onClick={() => onSelectCard(card.id, true)}
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
                            onClick={() => onDeleteCard(card.id)}
                            title="Xóa thẻ khỏi ví"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#fca5a5',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <DeleteOutlined style={{ color: '#ef4444' }} />
                            <span>Xóa</span>
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
                onClick={() => onSelectCard(card.id, true)}
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
                    onClick={() => onToggleLock(card.id)}
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
                    onClick={() => onDeleteCard(card.id)}
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
  );
}
