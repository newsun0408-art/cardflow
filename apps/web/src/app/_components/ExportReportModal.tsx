'use client';

import {
  CloseOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';

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
  onToast: (msg: string) => void;
}

export function ExportReportModal({
  isOpen,
  transactions,
  holderName = 'LÊ HUỲNH THUẬN',
  activeCardName = 'Tất cả các thẻ',
  onClose,
  onToast,
}: ExportReportModalProps) {
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

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

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
          <td style="padding: 10px;">${tx.dateDisplay} ${tx.time}</td>
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

        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontSize: '22px',
              flexShrink: 0,
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
              Xem & Xuất Báo Cáo Sao Kê Giao Dịch
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
              Chủ thẻ: <strong style={{ color: '#f8fafc' }}>{holderName}</strong> • Thẻ: <strong style={{ color: '#38bdf8' }}>{activeCardName}</strong> • {transactions.length} giao dịch được chọn
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tổng giao dịch
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {transactions.length} <span style={{ fontSize: '12px', fontWeight: 600 }}>GD</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownOutlined style={{ color: '#f87171' }} /> Tổng Chi Tiêu (-)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', marginTop: '4px', fontFamily: 'monospace' }}>
              -{formatVND(totalExpense)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpOutlined style={{ color: '#4ade80' }} /> Tiền Hoàn / Nạp (+)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#4ade80', marginTop: '4px', fontFamily: 'monospace' }}>
              +{formatVND(totalIncome)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Biến động ròng
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: netChange >= 0 ? '#4ade80' : '#f87171',
                marginTop: '4px',
                fontFamily: 'monospace',
              }}
            >
              {netChange >= 0 ? '+' : ''}{formatVND(netChange)}
            </div>
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
                    {tx.dateDisplay} {tx.time}
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

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            💡 File CSV hỗ trợ mở trực tiếp trên Microsoft Excel và Google Sheets.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <PrinterOutlined style={{ color: '#38bdf8' }} /> In / Lưu PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              <DownloadOutlined /> Tải File CSV (Excel)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
