import { createHttpClient, type HttpClient } from 'fe-kit/http';
import { env } from './env';

export interface ApiOptions {
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => Promise<string | null>;
}

export function createApi(options: ApiOptions = {}): HttpClient {
  return createHttpClient({
    baseUrl: env.endpoint('gateway'),
    service: 'gateway',
    getToken: options.getToken,
    onUnauthorized: options.onUnauthorized,
    headers: { origin: env.endpoint('webOrigin') },
  });
}

export interface HealthDto {
  status: string;
}

export function health(api: HttpClient): Promise<HealthDto> {
  return api.get<HealthDto>('/healthz');
}

// --- Card Feature Contract & API ---

export interface CardDto {
  id: string;
  nickname: string;
  bankName: string;
  cardType: string;
  lastFourDigits: string;
  cardNumberFormatted: string;
  nfcId: string;
  holderName: string;
  expiryDate: string;
  cvv: string;
  theme: string;
  isLocked: boolean;
  isDefault: boolean;
  balance: number;
  dailyLimit: number;
  spentToday: number;
  onlinePayment: boolean;
  internationalPayment: boolean;
  atmWithdrawal: boolean;
  notificationsEnabled: boolean;
}

export interface CreateCardInput {
  nickname: string;
  bankName?: string;
  cardType?: string;
  fullCardNumber?: string;
  holderName: string;
  expiryDate?: string;
  cvv?: string;
  theme?: string;
  dailyLimit?: number;
  pin?: string;
  onlinePayment?: boolean;
  internationalPayment?: boolean;
  atmWithdrawal?: boolean;
  notificationsEnabled?: boolean;
}

export interface VerifyPinInput {
  cardId: string;
  pin: string;
}

export interface DecryptedCardData {
  fullCardNumber: string;
  cvv: string;
}

export interface VerifyPinResult {
  success: boolean;
  decryptedData?: DecryptedCardData;
  expiresInSeconds?: number;
  error?: string;
  attemptsLeft?: number;
  lockedUntil?: number;
}

export interface ChangePinInput {
  cardId: string;
  oldPin: string;
  newPin: string;
}

export interface SetLimitInput {
  cardId: string;
  dailyLimit: number;
}

export interface ToggleLockInput {
  cardId: string;
}

export const cardApi = {
  list: (api: HttpClient) =>
    api.get<CardDto[]>('/cardflow-backend/v1/card/actions/list'),

  getById: (api: HttpClient, cardId: string) =>
    api.get<CardDto>(`/cardflow-backend/v1/card/actions/view/${cardId}`),

  create: (api: HttpClient, data: CreateCardInput) =>
    api.post<CardDto>('/cardflow-backend/v1/card/actions/create', data),

  verifyPin: (api: HttpClient, data: VerifyPinInput) =>
    api.post<VerifyPinResult>('/cardflow-backend/v1/card/actions/verify-pin', data),

  changePin: (api: HttpClient, data: ChangePinInput) =>
    api.post<{ success: boolean }>('/cardflow-backend/v1/card/actions/change-pin', data),

  setLimit: (api: HttpClient, data: SetLimitInput) =>
    api.post<{ success: boolean }>('/cardflow-backend/v1/card/actions/set-limit', data),

  toggleLock: (api: HttpClient, data: ToggleLockInput) =>
    api.post<{ success: boolean; isLocked: boolean }>('/cardflow-backend/v1/card/actions/toggle-lock', data),
};

// --- Google Drive & Sheets Integration Contract & API ---

export interface GoogleConnectResponse {
  state: string;
  authUrl: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType?: string;
  webViewUrl?: string;
  size?: string;
}

export interface GoogleSyncResponse {
  folderId: string;
  folderName: string;
  files: GoogleDriveFile[];
  total: number;
}

export interface GoogleUploadInput {
  state: string;
  fileName: string;
  content: string;
  mimeType?: string;
}

export interface GoogleSheetResponse {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  folderId?: string;
  folderName?: string;
}

export interface AppendRowsInput {
  state: string;
  spreadsheetId: string;
  range: string;
  values: any[][];
}

export interface AppendRowsResponse {
  spreadsheetId: string;
  tableRange?: string;
  updatedRange?: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface ReadRowsResponse {
  spreadsheetId: string;
  range: string;
  values: any[][];
}

export interface ParsedSheetTransaction {
  id: string;
  referenceId: string;
  date: string;
  time: string;
  cardLast4: string;
  merchant: string;
  category: string;
  categoryLabel: string;
  amount: number;
  type: 'expense' | 'income';
  status: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface ImportSheetInput {
  state: string;
  spreadsheetId: string;
  range?: string;
}

export interface ImportSheetResponse {
  spreadsheetId: string;
  title: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  totalExpense: number;
  totalIncome: number;
  netChange: number;
  transactions: ParsedSheetTransaction[];
}

export const googleDriveApi = {
  connect: (api: HttpClient) =>
    api.get<GoogleConnectResponse>('/cardflow-backend/v1/drive/actions/connect'),

  listFiles: (api: HttpClient, state: string) =>
    api.get<GoogleDriveFile[]>(`/cardflow-backend/v1/drive/actions/files?state=${encodeURIComponent(state)}`),

  getImported: (api: HttpClient, state: string) =>
    api.get<GoogleDriveFile[]>(`/cardflow-backend/v1/drive/actions/imported?state=${encodeURIComponent(state)}`),

  upload: (api: HttpClient, payload: GoogleUploadInput) =>
    api.post<GoogleDriveFile>('/cardflow-backend/v1/drive/actions/upload', payload),

  sync: (api: HttpClient, state: string) =>
    api.post<GoogleSyncResponse>('/cardflow-backend/v1/drive/actions/sync', { state }),
};

export const googleSheetApi = {
  create: (api: HttpClient, payload: { state: string; title: string }) =>
    api.post<GoogleSheetResponse>('/cardflow-backend/v1/sheet/actions/create', payload),

  append: (api: HttpClient, payload: AppendRowsInput) =>
    api.post<AppendRowsResponse>('/cardflow-backend/v1/sheet/actions/append', payload),

  readRows: (api: HttpClient, params: { state: string; spreadsheetId: string; range?: string }) => {
    const qs = new URLSearchParams({
      state: params.state,
      spreadsheetId: params.spreadsheetId,
      ...(params.range ? { range: params.range } : {}),
    });
    return api.get<ReadRowsResponse>(`/cardflow-backend/v1/sheet/actions/read?${qs.toString()}`);
  },

  importSheet: (api: HttpClient, payload: ImportSheetInput) =>
    api.post<ImportSheetResponse>('/cardflow-backend/v1/sheet/actions/import', payload),
};


