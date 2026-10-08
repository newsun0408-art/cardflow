'use client';

import { useState, useEffect } from 'react';
import {
  CloseOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  CloudUploadOutlined,
  TableOutlined,
  LoadingOutlined,
  LinkOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import {
  exportToGoogleSheetAction,
  getGoogleAuthUrlAction,
  checkGoogleConnectionStatusAction,
  getGoogleDriveStatusAction,
} from '../actions/google-integration';
import { formatTransactionDate } from '@/features/transactions';

export interface ReportTransactionItem {
  id: string;
  cardId: string;
  cardLast4: string;
  merchant: string;
  category: string;
  categoryLabel: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  dateDisplay: string;
  time: string;
  status: string;
  referenceId: string;
}

interface ExportReportModalProps {
  isOpen: boolean;
  transactions: ReportTransactionItem[];
  holderName?: string;
  activeCardName?: string;
  onClose: () => void;
  onOpenImportSheet?: () => void;
  onToast: (msg: string) => void;
}

export function ExportReportModal({
  isOpen,
  transactions,
  holderName = 'LÊ HUỲNH THUẬN',
  activeCardName = 'Tất cả các thẻ',
  onClose,
  onOpenImportSheet: _onOpenImportSheet,
  onToast,
}: ExportReportModalProps) {

  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [lastSheetUrl, setLastSheetUrl] = useState<string | null>(null);
  const [lastDriveUrl] = useState<string | null>(null);

  // Google OAuth Connection State via Go Backend
  const [googleState, setGoogleState] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

  // Kiểm tra kết nối từ localStorage và kiểm tra trạng thái với Go Backend
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('cardflow_google_state');
      setIsCheckingGoogle(true);
      getGoogleDriveStatusAction().then((status) => {
        if (status.connected && status.state) {
          setIsGoogleConnected(true);
          setGoogleState(status.state);
          localStorage.setItem('cardflow_google_state', status.state);
        } else if (savedState) {
          setGoogleState(savedState);
          checkGoogleConnectionStatusAction(savedState).then((res) => {
            setIsGoogleConnected(res.connected);
          });
        } else {
          setIsGoogleConnected(false);
        }
        setIsCheckingGoogle(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalExpense = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  const totalIncome = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const netChange = totalIncome - totalExpense;

  const formatVND = (amt: number) => {
    return amt.toLocaleString('vi-VN') + ' ₫';
  };

  // Export CSV Handler (UTF-8 BOM for correct Vietnamese Excel display)
  const handleDownloadCSV = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Sao_Ke_Giao_Dich_Cardflow_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onToast('📥 Đã tải xuống file sao kê CSV (Excel) thành công!');
  };

  const generateCSVContent = () => {
    const headers = [
      'STT',
      'Mã Giao Dịch',
      'Ngày',
      'Giờ',
      'Thẻ',
      'Đơn Vị (Merchant)',
      'Danh Mục',
      'Loại',
      'Số Tiền (VND)',
      'Trạng Thái',
    ];

    const rows = transactions.map((tx, idx) => [
      idx + 1,
      `"${tx.referenceId}"`,
      `"${tx.date}"`,
      `"${tx.time}"`,
      `"•••• ${tx.cardLast4}"`,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      `"${tx.categoryLabel}"`,
      `"${tx.type === 'expense' ? 'Chi tiêu (-)' : 'Hoàn tiền (+)'}"`,
      tx.amount,
      `"${tx.status}"`,
    ]);

    return (
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    );
  };

  // Google OAuth Connect Handler via Go Backend
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await getGoogleAuthUrlAction();
      const authUrl = res.success && res.authUrl
        ? res.authUrl
        : 'http://localhost:8080/cardflow-backend/v1/drive/actions/connect?redirect=true';
      const state = res.state || 'drive-auth';

      if (res.state) {
        localStorage.setItem('cardflow_google_state', state);
        setGoogleState(state);
      }

      // Mở cửa sổ popup cấp quyền Google
      const width = 560;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        authUrl,
        'CardflowGoogleOAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Thăm dò kiểm tra trạng thái token & thư mục CardFlow từ Go Backend
      let attempts = 0;
      const maxAttempts = 45; // ~60s
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const status = await getGoogleDriveStatusAction();
          if (status.connected) {
            clearInterval(pollTimer);
            try {
              popup?.close();
            } catch {}
            setIsGoogleConnected(true);
            if (status.state) {
              setGoogleState(status.state);
              localStorage.setItem('cardflow_google_state', status.state);
            }
            setIsConnectingGoogle(false);
            onToast('🎉 Kết nối Google Drive & Sheets thành công! Thư mục "CardFlow" đã sẵn sàng.');
          } else if (attempts >= maxAttempts || (popup && popup.closed)) {
            const finalCheck = await getGoogleDriveStatusAction();
            if (finalCheck.connected) {
              clearInterval(pollTimer);
              setIsGoogleConnected(true);
              if (finalCheck.state) {
                setGoogleState(finalCheck.state);
                localStorage.setItem('cardflow_google_state', finalCheck.state);
              }
              setIsConnectingGoogle(false);
              onToast('🎉 Kết nối Google Drive & Sheets thành công! Thư mục "CardFlow" đã sẵn sàng.');
            } else if (attempts >= maxAttempts) {
              clearInterval(pollTimer);
              setIsConnectingGoogle(false);
            }
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setIsConnectingGoogle(false);
          }
        }
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onToast(`⚠️ Lỗi kết nối Google: ${msg}`);
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem('cardflow_google_state');
    setGoogleState(null);
    setIsGoogleConnected(false);
    onToast('ℹ️ Đã ngắt kết nối tài khoản Google');
  };

  // Google Sheets Export Handler
  const handleExportGoogleSheet = async () => {
    if (transactions.length === 0) {
      onToast('⚠️ Không có giao dịch nào để xuất sang Google Sheets');
      return;
    }

    let activeState = googleState;
    if (!activeState) {
      const status = await getGoogleDriveStatusAction();
      if (status.connected && status.state) {
        activeState = status.state;
        setGoogleState(status.state);
        setIsGoogleConnected(true);
      }
    }

    if (!activeState) {
      onToast('👉 Vui lòng kết nối tài khoản Google trước khi xuất bảng tính.');
      handleConnectGoogle();
      return;
    }

    setIsExportingSheet(true);
    try {
      const res = await exportToGoogleSheetAction({
        state: activeState,
        title: `Sao Kê Giao Dịch Cardflow - ${new Date().toISOString().slice(0, 10)}`,
        holderName,
        cardName: activeCardName,
        transactions,
      });

      if (res.success && res.spreadsheetUrl) {
        setLastSheetUrl(res.spreadsheetUrl);
        onToast('✨ Đã tạo Google Sheet thành công trong thư mục CardFlow!');
        window.open(res.spreadsheetUrl, '_blank');
      } else {
        if (res.error && /not connected|state is invalid|state is required/i.test(res.error)) {
          localStorage.removeItem('cardflow_google_state');
          setGoogleState(null);
          setIsGoogleConnected(false);
          onToast('⚠️ Phiên Google đã hết hiệu lực. Hệ thống sẽ kết nối lại cho bạn.');
          handleConnectGoogle();
          return;
        }
        onToast(`⚠️ Lỗi tạo Google Sheet: ${res.error || 'Vui lòng kiểm tra lại'}`);
      }
    } catch {
      onToast('⚠️ Lỗi kết nối khi xuất sang Google Sheets');
    } finally {
      setIsExportingSheet(false);
    }
  };

  // Print/Save PDF Handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onToast('⚠️ Trình duyệt chặn pop-up in. Vui lòng cho phép pop-up để in báo cáo.');
      return;
    }

    const rowsHtml = transactions
      .map(
        (tx, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; font-family: monospace; font-size: 11px;">${tx.referenceId}</td>
          <td style="padding: 10px;">${formatTransactionDate(tx.date, tx.dateDisplay)} ${tx.time}</td>
          <td style="padding: 10px;">•••• ${tx.cardLast4}</td>
          <td style="padding: 10px; font-weight: 600;">${tx.merchant}</td>
          <td style="padding: 10px;">${tx.categoryLabel}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: ${
            tx.amount > 0 ? '#16a34a' : '#0f172a'
          };">
            ${tx.amount > 0 ? '+' : ''}${formatVND(tx.amount)}
          </td>
          <td style="padding: 10px; text-align: center; color: #0284c7; font-weight: 600;">${tx.status}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Báo Cáo Sao Kê Giao Dịch — Cardflow</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 40px; margin: 0; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 24px; font-weight: 800; color: #0284c7; margin: 0; }
            .meta { font-size: 13px; color: #64748b; line-height: 1.6; }
            .kpi { display: flex; gap: 20px; margin-bottom: 30px; }
            .kpi-card { flex: 1; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
            .kpi-title { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .kpi-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CARDFLOW FINANCIAL</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #334155;">BÁO CÁO SAO KÊ GIAO DỊCH CHI TIẾT</p>
            </div>
            <div class="meta" style="text-align: right;">
              <div>Chủ tài khoản: <strong>${holderName}</strong></div>
              <div>Phạm vi: <strong>${activeCardName}</strong></div>
              <div>Ngày xuất: <strong>${new Date().toLocaleDateString('vi-VN')}</strong></div>
            </div>
          </div>

          <div class="kpi">
            <div class="kpi-card">
              <div class="kpi-title">Tổng số giao dịch</div>
              <div class="kpi-val" style="color: #0284c7;">${transactions.length} GD</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Tổng tiền chi tiêu (-)</div>
              <div class="kpi-val" style="color: #ef4444;">-${formatVND(totalExpense)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Tổng hoàn tiền (+)</div>
              <div class="kpi-val" style="color: #16a34a;">+${formatVND(totalIncome)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Biến động ròng</div>
              <div class="kpi-val" style="color: ${netChange >= 0 ? '#16a34a' : '#ef4444'};">
                ${netChange >= 0 ? '+' : ''}${formatVND(netChange)}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">STT</th>
                <th>Mã GD</th>
                <th>Thời Gian</th>
                <th>Thẻ</th>
                <th>Đơn Vị / Merchant</th>
                <th>Danh Mục</th>
                <th style="text-align: right;">Số Tiền</th>
                <th style="text-align: center;">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Báo cáo sao kê được kết xuất tự động từ hệ thống Quản lý Thẻ Cá Nhân Cardflow • Có giá trị đối chiếu thông tin giao dịch cá nhân.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onToast('🖨️ Đã mở cửa sổ in sao kê PDF!');
  };

  return (
    <div
      onClick={onClose}
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
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxSizing: 'border-box',
          position: 'relative',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
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
            zIndex: 2,
          }}
          title="Đóng"
        >
          <CloseOutlined style={{ fontSize: '14px' }} />
        </button>

        {/* Header Section: Tinh tế, thoáng đãng, không rườm rà */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextOutlined style={{ color: '#38bdf8', fontSize: '18px' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Xuất Báo Cáo Sao Kê Giao Dịch
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Chủ thẻ: <strong style={{ color: '#f8fafc' }}>{holderName}</strong> • {activeCardName} • {transactions.length} giao dịch
            </div>
            {/* Dòng số liệu tóm tắt mỏng, tinh gọn */}
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span>
                Chi tiêu: <strong style={{ color: '#f87171' }}>-{formatVND(totalExpense)}</strong>
              </span>
              <span>•</span>
              <span>
                Hoàn tiền: <strong style={{ color: '#4ade80' }}>+{formatVND(totalIncome)}</strong>
              </span>
              <span>•</span>
              <span>
                Biến động ròng:{' '}
                <strong style={{ color: netChange >= 0 ? '#4ade80' : '#f87171' }}>
                  {netChange >= 0 ? '+' : ''}{formatVND(netChange)}
                </strong>
              </span>
            </div>
          </div>

          {/* Google Drive Status: Badge nhỏ thanh lịch góc phải */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isGoogleConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
              border: isGoogleConnected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
            }}
          >
            <GoogleOutlined style={{ color: isGoogleConnected ? '#34d399' : '#38bdf8' }} />
            <span style={{ color: isGoogleConnected ? '#34d399' : '#38bdf8', fontWeight: 600 }}>
              {isGoogleConnected ? 'Drive: CardFlow' : 'Drive: Chưa kết nối'}
            </span>
            {isCheckingGoogle ? (
              <LoadingOutlined style={{ fontSize: '11px', color: '#94a3b8' }} />
            ) : isGoogleConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Đổi
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {isConnectingGoogle ? 'Đang mở...' : 'Kết nối'}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Statement Table Preview */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.6)',
            marginBottom: '20px',
            minHeight: '200px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '12px 14px', fontWeight: 700, width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Mã GD</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Thời Gian</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Thẻ</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Đơn Vị / Merchant</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Danh Mục</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Số Tiền</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <td style={{ padding: '10px 14px', color: '#64748b', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                    {tx.referenceId}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                    {formatTransactionDate(tx.date, tx.dateDisplay)} {tx.time}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                    •••• {tx.cardLast4}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#ffffff' }}>
                    {tx.merchant}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                    {tx.categoryLabel}
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: tx.amount > 0 ? '#4ade80' : '#f8fafc',
                    }}
                  >
                    {tx.amount > 0 ? `+${formatVND(tx.amount)}` : formatVND(tx.amount)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cloud Links Banner if generated */}
        {(lastSheetUrl || lastDriveUrl) && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6ee7b7' }}>
              <LinkOutlined style={{ color: '#10b981' }} />
              <span>Đã xuất thành công:</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {lastSheetUrl && (
                <a
                  href={lastSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  <TableOutlined /> Mở Google Sheets ↗
                </a>
              )}
              {lastDriveUrl && (
                <a
                  href={lastDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  <CloudUploadOutlined /> Xem trên Google Drive ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {/* Footer Actions: Tối giản, thanh lịch, gọn gàng */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Xuất file sao kê chuẩn bảng tính hoặc in ấn đối chiếu
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PrinterOutlined style={{ color: '#38bdf8' }} /> In / PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <DownloadOutlined /> Tải CSV
            </button>

            <button
              type="button"
              onClick={handleExportGoogleSheet}
              disabled={isExportingSheet}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                background: isExportingSheet
                  ? '#334155'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isExportingSheet ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
              }}
            >
              {isExportingSheet ? (
                <>
                  <LoadingOutlined /> Đang tạo Sheet...
                </>
              ) : (
                <>
                  <TableOutlined /> Xuất Google Sheets
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
