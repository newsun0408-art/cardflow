'use server';

import { createLogger } from 'fe-kit/logger';
import {
  createApi,
  googleDriveApi,
  googleSheetApi,
  type GoogleDriveFile,
  type ParsedSheetTransaction,
} from '@cardflow-app/shared';

const logger = createLogger('google-integration-action');

export interface ImportSheetResult {
  success: boolean;
  spreadsheetId?: string;
  title?: string;
  totalRows?: number;
  validCount?: number;
  errorCount?: number;
  totalExpense?: number;
  totalIncome?: number;
  netChange?: number;
  transactions?: ParsedSheetTransaction[];
  error?: string;
}

export interface SheetTransactionItem {
  id: string;
  referenceId: string;
  date: string;
  time: string;
  cardLast4: string;
  merchant: string;
  categoryLabel: string;
  type: 'expense' | 'income';
  amount: number;
  status: string;
}

export interface GoogleAuthUrlResult {
  success: boolean;
  state?: string;
  authUrl?: string;
  error?: string;
}

export interface GoogleConnectionStatusResult {
  success: boolean;
  connected: boolean;
  state?: string;
  folderName?: string;
  files?: GoogleDriveFile[];
  error?: string;
}

export interface ExportSheetResult {
  success: boolean;
  title: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  folderName?: string;
  error?: string;
}

export interface UploadDriveResult {
  success: boolean;
  fileId?: string;
  fileName: string;
  webViewLink?: string;
  folderName?: string;
  error?: string;
}

/**
 * Server Action: Lấy link OAuth cấp quyền Google Drive & Sheets từ Go Backend.
 */
export async function getGoogleAuthUrlAction(): Promise<GoogleAuthUrlResult> {
  try {
    const api = createApi();
    const res = await googleDriveApi.connect(api);
    logger.info('Retrieved Google OAuth authUrl from Go backend', { state: res?.state });
    return {
      success: true,
      state: res.state,
      authUrl: res.authUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to get Google auth URL from Go backend', { error: message });
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Kiểm tra trạng thái đã kết nối Google cho state hay chưa qua Go Backend.
 */
export async function checkGoogleConnectionStatusAction(
  state: string,
): Promise<GoogleConnectionStatusResult> {
  if (!state) {
    return { success: true, connected: false };
  }

  try {
    const api = createApi();
    const files = await googleDriveApi.getImported(api, state);
    logger.info('Checked Google connection status via Go backend', { state, count: files?.length ?? 0 });
    return {
      success: true,
      connected: true,
      state,
      folderName: 'CardFlow',
      files: files ?? [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('Google connection check failed for state; treating as disconnected', {
      state,
      error: message,
    });
    return {
      success: true,
      connected: false,
      state,
    };
  }
}

/**
 * Server Action: Xuất danh sách giao dịch sang Google Sheets qua Go Backend.
 * Go Backend sẽ tự động tạo Sheet và chuyển vào thư mục "CardFlow" trên Google Drive.
 */
export async function exportToGoogleSheetAction(payload: {
  state: string;
  title?: string;
  holderName?: string;
  cardName?: string;
  transactions: SheetTransactionItem[];
}): Promise<ExportSheetResult> {
  const { state, transactions, holderName = 'LÊ HUỲNH THUẬN', cardName = 'Tất cả các thẻ' } = payload;
  const title = payload.title || `Sao Kê Giao Dịch Cardflow - ${new Date().toISOString().slice(0, 10)}`;

  logger.info('Initiating Google Sheet export via Go backend', {
    state,
    title,
    txCount: transactions.length,
  });

  if (!state) {
    return {
      success: false,
      title,
      error: 'Tài khoản chưa được kết nối với Google Drive. Vui lòng bấm Kết nối trước.',
    };
  }

  try {
    const api = createApi();

    // 1. Yêu cầu Go backend tạo Spreadsheet trong folder "CardFlow"
    const sheetRes = await googleSheetApi.create(api, {
      state,
      title,
    });

    if (!sheetRes?.spreadsheetId) {
      throw new Error('Go backend không trả về spreadsheetId');
    }

    // 2. Chuẩn bị bảng dữ liệu và tính toán thống kê
    const totalExpense = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const values: (string | number)[][] = [
      ['CARDFLOW - BÁO CÁO SAO KÊ GIAO DỊCH TÀI CHÍNH', '', '', '', '', '', '', '', ''],
      ['Chủ thẻ:', holderName, 'Thẻ áp dụng:', cardName, 'Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN'), '', '', ''],
      ['Tổng chi tiêu:', `${totalExpense.toLocaleString('vi-VN')} ₫`, 'Tổng thu / Hoàn:', `${totalIncome.toLocaleString('vi-VN')} ₫`, 'Biến động ròng:', `${(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫`, '', '', ''],
      [],
      ['STT', 'Mã GD', 'Ngày GD', 'Giờ GD', 'Thẻ', 'Đơn Vị Chấp Nhận (Merchant)', 'Danh Mục', 'Số Tiền (VND)', 'Trạng Thái'],
    ];

    transactions.forEach((tx, idx) => {
      values.push([
        idx + 1,
        tx.referenceId || tx.id,
        tx.date,
        tx.time,
        `•••• ${tx.cardLast4}`,
        tx.merchant,
        tx.categoryLabel,
        tx.amount,
        tx.status,
      ]);
    });

    // 3. Append dữ liệu vào Sheet vừa tạo
    await googleSheetApi.append(api, {
      state,
      spreadsheetId: sheetRes.spreadsheetId,
      range: 'Sheet1!A1',
      values,
    });

    logger.info('Google Sheet export completed successfully via Go backend', {
      spreadsheetId: sheetRes.spreadsheetId,
      url: sheetRes.spreadsheetUrl,
    });

    return {
      success: true,
      title: sheetRes.title || title,
      spreadsheetId: sheetRes.spreadsheetId,
      spreadsheetUrl: sheetRes.spreadsheetUrl,
      folderName: sheetRes.folderName || 'CardFlow',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Google Sheet export failed on Go backend', { error: message });
    return {
      success: false,
      title,
      error: message,
    };
  }
}

/**
 * Server Action: Lưu sao lưu file CSV lên Google Drive (Folder CardFlow) qua Go Backend.
 */
export async function backupToGoogleDriveAction(payload: {
  state: string;
  fileName?: string;
  csvContent: string;
}): Promise<UploadDriveResult> {
  const { state, csvContent } = payload;
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = payload.fileName || `Sao_Ke_Cardflow_${dateStr}.csv`;

  logger.info('Initiating Google Drive backup via Go backend', { state, fileName });

  if (!state) {
    return {
      success: false,
      fileName,
      error: 'Tài khoản chưa được kết nối với Google Drive. Vui lòng bấm Kết nối trước.',
    };
  }

  try {
    const api = createApi();
    const res = await googleDriveApi.upload(api, {
      state,
      fileName,
      content: csvContent,
      mimeType: 'text/csv',
    });

    logger.info('Google Drive backup completed successfully via Go backend', {
      fileId: res.id,
      name: res.name,
      url: res.webViewUrl,
    });

    return {
      success: true,
      fileId: res.id,
      fileName: res.name,
      webViewLink: res.webViewUrl,
      folderName: 'CardFlow',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Google Drive backup failed on Go backend', { error: message });
    return {
      success: false,
      fileName,
      error: message,
    };
  }
}

/**
 * Server Action: Đọc và phân tích các giao dịch từ một Google Sheet qua Go Backend.
 */
export async function importFromGoogleSheetAction(payload: {
  state: string;
  spreadsheetIdOrUrl: string;
  range?: string;
}): Promise<ImportSheetResult> {
  const { state, spreadsheetIdOrUrl, range } = payload;
  logger.info('Initiating Google Sheet import via Go backend', {
    state,
    sheetTarget: spreadsheetIdOrUrl,
  });

  if (!state) {
    return {
      success: false,
      error: 'Tài khoản chưa được kết nối với Google. Vui lòng kết nối trước.',
    };
  }

  if (!spreadsheetIdOrUrl || !spreadsheetIdOrUrl.trim()) {
    return {
      success: false,
      error: 'Vui lòng cung cấp link hoặc ID Google Sheet hợp lệ.',
    };
  }

  try {
    const api = createApi();
    const res = await googleSheetApi.importSheet(api, {
      state,
      spreadsheetId: spreadsheetIdOrUrl.trim(),
      range: range || '',
    });

    logger.info('Google Sheet import completed successfully via Go backend', {
      spreadsheetId: res.spreadsheetId,
      totalRows: res.totalRows,
      validCount: res.validCount,
    });

    return {
      success: true,
      spreadsheetId: res.spreadsheetId,
      title: res.title,
      totalRows: res.totalRows,
      validCount: res.validCount,
      errorCount: res.errorCount,
      totalExpense: res.totalExpense,
      totalIncome: res.totalIncome,
      netChange: res.netChange,
      transactions: res.transactions,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Google Sheet import failed on Go backend', { error: message });
    return {
      success: false,
      error: message,
    };
  }
}

