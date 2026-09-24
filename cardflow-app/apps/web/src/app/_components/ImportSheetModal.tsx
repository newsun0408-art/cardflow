'use client';

import { useState, useEffect } from 'react';
import {
  CloseOutlined,
  TableOutlined,
  GoogleOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  WarningFilled,
  CloudDownloadOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  FileExcelOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SyncOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import {
  getGoogleAuthUrlAction,
  checkGoogleConnectionStatusAction,
  importFromGoogleSheetAction,
} from '../actions/google-integration';
import type { CardDataModel } from './AddCardModal';
import type { TransactionItem } from './TransactionExpenseManager';
import type { ParsedSheetTransaction, GoogleDriveFile } from '@cardflow-app/shared';


interface ImportSheetModalProps {
  isOpen: boolean;
  cards: CardDataModel[];
  activeCardId?: string;
  onClose: () => void;
  onImportSuccess: (transactions: TransactionItem[], targetCardId?: string) => void;
  onToast: (msg: string) => void;
}

export function ImportSheetModal({
  isOpen,
  cards,
  activeCardId,
  onClose,
  onImportSuccess,
  onToast,
}: ImportSheetModalProps) {
  // Google OAuth Connection State
  const [googleState, setGoogleState] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);

  // Input source mode: 'drive' | 'url'
  const [sourceMode, setSourceMode] = useState<'drive' | 'url'>('drive');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [customSheetUrl, setCustomSheetUrl] = useState<string>('');

  // Target card: 'auto' or a specific card ID
  const [targetCardSelection, setTargetCardSelection] = useState<string>('auto');

  // Parse state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    spreadsheetId: string;
    title: string;
    totalRows: number;
    validCount: number;
    errorCount: number;
    totalExpense: number;
    totalIncome: number;
    netChange: number;
    transactions: ParsedSheetTransaction[];
  } | null>(null);

  // Sync Google state on open
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('cardflow_google_state');
      if (savedState) {
        setGoogleState(savedState);
        setIsCheckingGoogle(true);
        checkGoogleConnectionStatusAction(savedState).then((res) => {
          setIsGoogleConnected(res.connected);
          if (res.files && res.files.length > 0) {
            setDriveFiles(res.files);
            // Default select the first file
            if (!selectedFileId && res.files[0]?.id) {
              setSelectedFileId(res.files[0].id);
            }
          }
          setIsCheckingGoogle(false);
        });
      } else {
        setIsCheckingGoogle(false);
      }
    }
  }, [isOpen, selectedFileId]);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await getGoogleAuthUrlAction();
      if (res.success && res.authUrl && res.state) {
        localStorage.setItem('cardflow_google_state', res.state);
        setGoogleState(res.state);

        const width = 560;
        const height = 680;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const authWindow = window.open(
          res.authUrl,
          'CardFlowGoogleAuth',
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`,
        );

        const pollTimer = setInterval(async () => {
          if (!authWindow || authWindow.closed) {
            clearInterval(pollTimer);
            setIsConnectingGoogle(false);
            const status = await checkGoogleConnectionStatusAction(res.state!);
            if (status.connected) {
              setIsGoogleConnected(true);
              if (status.files) setDriveFiles(status.files);
              onToast('🎉 Kết nối Google Drive & Sheets thành công!');
            }
          }
        }, 1000);
      } else {
        onToast(`⚠️ Lỗi khởi tạo xác thực: ${res.error || 'Vui lòng kiểm tra lại cấu hình'}`);
        setIsConnectingGoogle(false);
      }
    } catch {
      onToast('⚠️ Lỗi kết nối đến Google Backend');
      setIsConnectingGoogle(false);
    }
  };

  const handleRefreshDriveFiles = async () => {
    if (!googleState) return;
    setIsCheckingGoogle(true);
    const res = await checkGoogleConnectionStatusAction(googleState);
    if (res.connected && res.files) {
      setDriveFiles(res.files);
      onToast(`🔄 Đã tìm thấy ${res.files.length} file trong thư mục CardFlow`);
    } else {
      onToast('⚠️ Chưa tìm thấy file hoặc chưa kết nối Google Drive');
    }
    setIsCheckingGoogle(false);
  };

  // Run analysis on selected file or URL
  const handleAnalyzeSheet = async () => {
    if (!isGoogleConnected || !googleState) {
      onToast('👉 Vui lòng kết nối Google Drive & Sheets trước khi tiếp tục.');
      handleConnectGoogle();
      return;
    }

    const target = sourceMode === 'drive' ? selectedFileId : customSheetUrl;
    if (!target || !target.trim()) {
      onToast(
        sourceMode === 'drive'
          ? '⚠️ Vui lòng chọn một file trong thư mục CardFlow'
          : '⚠️ Vui lòng dán Link hoặc Spreadsheet ID Google Sheet',
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await importFromGoogleSheetAction({
        state: googleState,
        spreadsheetIdOrUrl: target.trim(),
      });

      if (res.success && res.transactions) {
        setParsedData({
          spreadsheetId: res.spreadsheetId || target,
          title: res.title || 'Google Sheet',
          totalRows: res.totalRows || res.transactions.length,
          validCount: res.validCount || 0,
          errorCount: res.errorCount || 0,
          totalExpense: res.totalExpense || 0,
          totalIncome: res.totalIncome || 0,
          netChange: res.netChange || 0,
          transactions: res.transactions,
        });

        if (res.validCount && res.validCount > 0) {
          onToast(`✨ Đọc thành công ${res.validCount} giao dịch từ bảng tính!`);
        } else {
          onToast('⚠️ Không tìm thấy dòng giao dịch hợp lệ nào trong sheet này.');
        }
      } else {
        onToast(`⚠️ Lỗi đọc Google Sheet: ${res.error || 'Vui lòng kiểm tra lại định dạng file'}`);
      }
    } catch {
      onToast('⚠️ Lỗi kết nối khi phân tích dữ liệu Google Sheet');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download sample CSV template
  const handleDownloadSampleTemplate = () => {
    const headers = [
      'STT',
      'Mã Giao Dịch',
      'Ngày',
      'Giờ',
      'Thẻ',
      'Đơn Vị (Merchant)',
      'Danh Mục',
      'Số Tiền (VND)',
      'Trạng Thái',
    ];
    const sampleRows = [
      ['1', 'TXN-8842-1001', '2026-09-24', '08:30', '•••• 8842', 'Highlands Coffee', 'Ẩm thực & Cafe', '-55000', 'Thành công'],
      ['2', 'TXN-8842-1002', '2026-09-24', '12:15', '•••• 8842', 'Cơm Niêu Sài Gòn', 'Ẩm thực & Cafe', '-120000', 'Thành công'],
      ['3', 'TXN-8842-1003', '2026-09-23', '15:00', '•••• 8842', 'Grab Transport', 'Di chuyển', '-42000', 'Thành công'],
      ['4', 'TXN-8842-1004', '2026-09-23', '19:45', '•••• 8842', 'Shopee Vietnam', 'Mua sắm', '-350000', 'Thành công'],
      ['5', 'TXN-8842-1005', '2026-09-22', '09:00', '•••• 8842', 'Công Ty TNHH ABC', 'Lương & Thu nhập', '25000000', 'Thành công'],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mau_Giao_Dich_Cardflow.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onToast('📥 Đã tải file mẫu chuẩn CardFlow!');
  };

  // Commit imported transactions into app state
  const handleCommitImport = () => {
    if (!parsedData || !parsedData.transactions || parsedData.transactions.length === 0) {
      onToast('⚠️ Không có dữ liệu giao dịch để nạp vào hệ thống.');
      return;
    }

    const validItems = parsedData.transactions.filter((t) => t.isValid);
    if (validItems.length === 0) {
      onToast('⚠️ Tất cả các dòng đều bị lỗi định dạng. Vui lòng kiểm tra lại sheet.');
      return;
    }

    // Convert to app's TransactionItem
    const appTransactions: TransactionItem[] = validItems.map((item, idx) => {
      // Find card ID
      let matchedCardId = activeCardId || cards[0]?.id || 'card-1';
      if (targetCardSelection === 'auto') {
        const found = cards.find(
          (c) =>
            c.lastFourDigits === item.cardLast4 ||
            (c.cardNumberFormatted && c.cardNumberFormatted.endsWith(item.cardLast4)),
        );

        if (found) {
          matchedCardId = found.id;
        }
      } else {
        matchedCardId = targetCardSelection;
      }

      // Format dateDisplay
      let dateDisplay = item.date;
      try {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          dateDisplay = `${d.getDate()} Th0${d.getMonth() + 1}`;
        }
      } catch {
        dateDisplay = item.date;
      }

      return {
        id: item.id || `imp-tx-${Date.now()}-${idx}`,
        referenceId: item.referenceId || `TXN-${item.cardLast4}-${Math.floor(10000 + Math.random() * 90000)}`,
        cardId: matchedCardId,
        cardLast4: item.cardLast4 || '8842',
        merchant: item.merchant || 'Giao dịch import',
        category: (item.category as any) || 'other',
        categoryLabel: item.categoryLabel || 'Khác',
        amount: item.amount,
        type: item.type || (item.amount < 0 ? 'expense' : 'income'),
        date: item.date,
        dateDisplay,
        time: item.time || '12:00',
        status: (item.status as any) || 'Thành công',
      };
    });

    onImportSuccess(appTransactions, targetCardSelection === 'auto' ? undefined : targetCardSelection);
    onToast(`🎉 Đã nạp thành công ${appTransactions.length} giao dịch vào CardFlow!`);
    onClose();
  };

  const formatVND = (amt: number) => amt.toLocaleString('vi-VN') + ' ₫';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                color: '#34d399',
                boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
              }}
            >
              <TableOutlined />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Nhập Dữ Liệu Từ Google Sheet
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Tự động đọc, phân loại giao dịch tài chính và đồng bộ vào CardFlow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              transition: 'all 0.2s',
            }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Connection Status Banner */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              background: isGoogleConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
              border: `1px solid ${isGoogleConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isGoogleConnected ? (
                <CheckCircleFilled style={{ color: '#34d399', fontSize: '18px' }} />
              ) : (
                <WarningFilled style={{ color: '#fbbf24', fontSize: '18px' }} />
              )}
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isGoogleConnected ? '#34d399' : '#fbbf24' }}>
                  {isGoogleConnected
                    ? 'Google Drive & Sheets đã kết nối (Thư mục: CardFlow)'
                    : 'Chưa kết nối tài khoản Google Drive & Sheets'}
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  {isGoogleConnected
                    ? `Đã nhận diện ${driveFiles.length} file sẵn sàng trong thư mục CardFlow`
                    : 'Cần cấp quyền để ứng dụng đọc bảng tính trên Google Drive của bạn'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isGoogleConnected ? (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isConnectingGoogle}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isConnectingGoogle ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isConnectingGoogle ? <LoadingOutlined /> : <GoogleOutlined />}
                  <span>{isConnectingGoogle ? 'Đang mở OAuth...' : 'Kết Nối Google Ngay'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRefreshDriveFiles}
                  disabled={isCheckingGoogle}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <SyncOutlined spin={isCheckingGoogle} />
                  <span>Làm mới file</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CloudDownloadOutlined />
                <span>Tải file mẫu CSV</span>
              </button>
            </div>
          </div>

          {/* Source Selection Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setSourceMode('drive')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: sourceMode === 'drive' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  border: `1px solid ${sourceMode === 'drive' ? 'rgba(56, 189, 248, 0.5)' : 'transparent'}`,
                  color: sourceMode === 'drive' ? '#38bdf8' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FolderOpenOutlined />
                <span>File Trong Thư Mục CardFlow ({driveFiles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceMode('url')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: sourceMode === 'url' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  border: `1px solid ${sourceMode === 'url' ? 'rgba(56, 189, 248, 0.5)' : 'transparent'}`,
                  color: sourceMode === 'url' ? '#38bdf8' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <LinkOutlined />
                <span>Nhập Link / ID Google Sheet</span>
              </button>
            </div>

            {/* TAB A: Pick from CardFlow Drive Folder */}
            {sourceMode === 'drive' && (
              <div>
                {driveFiles.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(30, 41, 59, 0.4)',
                      borderRadius: '14px',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <FileExcelOutlined style={{ fontSize: '32px', color: '#64748b', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
                      Chưa có file Sheet nào trong thư mục <strong>CardFlow</strong> trên Drive của bạn.
                    </p>
                    <p style={{ margin: '4px 0 12px 0', fontSize: '11px', color: '#64748b' }}>
                      Bạn có thể xuất một báo cáo từ CardFlow ra Sheet trước, hoặc chuyển sang tab &ldquo;Nhập Link / ID Google Sheet&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSourceMode('url')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Chuyển sang dán link Google Sheet ↗
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                    {driveFiles.map((file) => {
                      const isSelected = selectedFileId === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => setSelectedFileId(file.id)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                            border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <TableOutlined style={{ fontSize: '20px', color: isSelected ? '#34d399' : '#10b981' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: isSelected ? '#34d399' : '#f1f5f9',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Google Sheet</div>
                          </div>
                          {isSelected && <CheckCircleFilled style={{ color: '#34d399', fontSize: '16px' }} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB B: Paste custom Google Sheet Link or ID */}
            {sourceMode === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  Đường dẫn (URL) hoặc Spreadsheet ID của Google Sheet:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customSheetUrl}
                    onChange={(e) => setCustomSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {customSheetUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomSheetUrl('')}
                      style={{
                        padding: '0 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      Xoá
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  💡 Gợi ý: Hãy đảm bảo Google Sheet đã cấp quyền truy cập (Người xem / Người chỉnh sửa) cho tài khoản Google đã kết nối.
                </span>
              </div>
            )}

            {/* Button to run analysis */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleAnalyzeSheet}
                disabled={isAnalyzing || !isGoogleConnected}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: isAnalyzing
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isAnalyzing || !isGoogleConnected ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
                }}
              >
                {isAnalyzing ? <LoadingOutlined /> : <TableOutlined />}
                <span>{isAnalyzing ? 'Đang phân tích bảng tính...' : 'Phân Tích & Xem Trước Dữ Liệu'}</span>
              </button>
            </div>
          </div>

          {/* PREVIEW & VALIDATION SECTION */}
          {parsedData && (
            <div
              style={{
                marginTop: '10px',
                padding: '18px',
                borderRadius: '16px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Header of Preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Bảng tính:</span>
                    <span style={{ color: '#38bdf8' }}>{parsedData.title}</span>
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Tổng dòng đọc: <strong>{parsedData.totalRows}</strong></span>
                    <span style={{ color: '#34d399' }}>✓ Hợp lệ: <strong>{parsedData.validCount}</strong></span>
                    {parsedData.errorCount > 0 && (
                      <span style={{ color: '#f87171' }}>✕ Lỗi: <strong>{parsedData.errorCount}</strong></span>
                    )}
                  </div>
                </div>

                {/* Target Card Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCardOutlined style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Thẻ nhận:</span>
                  <select
                    value={targetCardSelection}
                    onChange={(e) => setTargetCardSelection(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  >
                    <option value="auto">Tự động theo số thẻ (•••• XXXX)</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname} (•••• {c.lastFourDigits})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stat Counters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowDownOutlined /> Tổng Chi Tiêu
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
                    -{formatVND(parsedData.totalExpense)}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowUpOutlined /> Tổng Thu Nhập / Hoàn
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                    +{formatVND(parsedData.totalIncome)}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8' }}>Biến Động Ròng</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: parsedData.netChange >= 0 ? '#34d399' : '#f87171', marginTop: '4px' }}>
                    {parsedData.netChange >= 0 ? '+' : ''}{formatVND(parsedData.netChange)}
                  </div>
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '8px 12px' }}>STT</th>
                        <th style={{ padding: '8px 12px' }}>Mã GD</th>
                        <th style={{ padding: '8px 12px' }}>Ngày & Giờ</th>
                        <th style={{ padding: '8px 12px' }}>Thẻ</th>
                        <th style={{ padding: '8px 12px' }}>Đơn Vị (Merchant)</th>
                        <th style={{ padding: '8px 12px' }}>Danh Mục</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Số Tiền</th>
                        <th style={{ padding: '8px 12px' }}>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.transactions.map((tx, idx) => {
                        const isExp = tx.type === 'expense';
                        return (
                          <tr
                            key={tx.id || idx}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                              opacity: tx.isValid ? 1 : 0.6,
                            }}
                          >
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#cbd5e1' }}>{tx.referenceId}</td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{tx.date} {tx.time}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', fontSize: '11px', color: '#cbd5e1' }}>
                                •••• {tx.cardLast4}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#f8fafc', fontWeight: 500 }}>{tx.merchant}</td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{tx.categoryLabel}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: isExp ? '#f87171' : '#34d399' }}>
                              {isExp ? '-' : '+'}{formatVND(Math.abs(tx.amount))}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: tx.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: tx.isValid ? '#34d399' : '#f87171',
                                }}
                              >
                                {tx.isValid ? tx.status || 'Hợp lệ' : 'Lỗi'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={!parsedData || parsedData.validCount === 0}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              background:
                !parsedData || parsedData.validCount === 0
                  ? 'rgba(148, 163, 184, 0.15)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: !parsedData || parsedData.validCount === 0 ? '#64748b' : '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: !parsedData || parsedData.validCount === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow:
                !parsedData || parsedData.validCount === 0
                  ? 'none'
                  : '0 4px 16px rgba(16, 185, 129, 0.4)',
            }}
          >
            <CheckCircleFilled />
            <span>
              Xác Nhận Nạp {parsedData && parsedData.validCount > 0 ? `${parsedData.validCount} ` : ''}Giao Dịch Vào CardFlow
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
