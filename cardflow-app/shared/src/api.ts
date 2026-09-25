// Client gọi backend. Một chỗ dựng, mọi nơi dùng.
import { createHttpClient, type HttpClient } from 'fe-kit/http';
import { env } from './env';

export interface ApiOptions {
  userId?: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => Promise<string | null>;
}

export function createApi(options: ApiOptions = {}): HttpClient {
  const isBrowser = typeof globalThis !== 'undefined' && 'document' in globalThis;
  let uid = options.userId;
  if (!uid && isBrowser) {
    try {
      uid = localStorage.getItem('cardflow_user_id') || 'usr-001';
    } catch {
      uid = 'usr-001';
    }
  }
  if (!uid) uid = 'usr-001';

  return createHttpClient({
    baseUrl: env.endpoint('gateway'),
    service: 'gateway',
    getToken: options.getToken,
    onUnauthorized: options.onUnauthorized,
    headers: isBrowser
      ? { 'X-User-Id': uid }
      : { origin: env.endpoint('webOrigin'), 'X-User-Id': uid },
  });
}

// ── Auth API ───────────────────────────────────────────────────
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface UserAuthDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
}

export interface AuthResultDto {
  token: string;
  user: UserAuthDto;
}

export function loginApi(api: HttpClient, input: LoginInput): Promise<AuthResultDto> {
  return api.post<AuthResultDto>('/api/v1/auth/login', input);
}

export function registerApi(api: HttpClient, input: RegisterInput): Promise<AuthResultDto> {
  return api.post<AuthResultDto>('/api/v1/auth/register', input);
}

export function getMeApi(api: HttpClient): Promise<UserAuthDto> {
  return api.get<UserAuthDto>('/api/v1/auth/me');
}

export interface HealthDto {
  status: string;
}

export function health(api: HttpClient): Promise<HealthDto> {
  return api.get<HealthDto>('/healthz');
}

// ── Cards API ──────────────────────────────────────────────────
export interface CardDto {
  id: string;
  userId: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  balance: number;
  currency: string;
  cardType: string;
  status: 'ACTIVE' | 'LOCKED';
  spendingLimit: number;
}

export function getCards(api: HttpClient): Promise<{ data: CardDto[] }> {
  return api.get<{ data: CardDto[] }>('/api/v1/cards');
}

export interface CreateCardDto {
  cardHolder: string;
  cardType?: string;
  spendingLimit?: number;
}

export function createCard(api: HttpClient, dto: CreateCardDto): Promise<{ data: CardDto }> {
  return api.post<{ data: CardDto }>('/api/v1/cards', dto);
}

export function updateCardStatus(api: HttpClient, cardId: string, status: 'ACTIVE' | 'LOCKED'): Promise<{ data: { id: string; status: string } }> {
  return api.patch<{ data: { id: string; status: string } }>( `/api/v1/cards/${cardId}/status`, { status });
}

// ── Transactions API ──────────────────────────────────────────
export interface TransactionDto {
  id: string;
  cardId: string;
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category: 'TECHNOLOGY' | 'FOOD' | 'TRANSPORT' | 'HOUSING' | 'OTHER';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface CategoryBreakdownDto {
  category: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ExpenseSummaryDto {
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  breakdown: CategoryBreakdownDto[];
}

export function getTransactions(
  api: HttpClient,
  category = 'ALL',
  status = 'ALL',
): Promise<{ data: TransactionDto[] }> {
  const query = new URLSearchParams();
  if (category && category !== 'ALL') query.set('category', category);
  if (status && status !== 'ALL') query.set('status', status);
  const qStr = query.toString();
  return api.get<{ data: TransactionDto[] }>(qStr ? `/api/v1/transactions?${qStr}` : '/api/v1/transactions');
}

export function getExpenseSummary(api: HttpClient): Promise<{ data: ExpenseSummaryDto }> {
  return api.get<{ data: ExpenseSummaryDto }>('/api/v1/transactions/summary');
}

export interface CreateTransactionInput {
  cardId?: string;
  title: string;
  amount: number;
  type?: 'EXPENSE' | 'INCOME';
  category?: string;
  note?: string;
}

export function createTransaction(api: HttpClient, input: CreateTransactionInput): Promise<{ data: TransactionDto }> {
  return api.post<{ data: TransactionDto }>('/api/v1/transactions', input);
}

// ── Google Drive & Sheets API ─────────────────────────────────
export interface SaveCardsToSheetInput {
  state?: string;
  cards: {
    id: string;
    nickname: string;
    bankName: string;
    cardType: string;
    cardCategory?: string;
    cardNetwork?: string;
    cardNumber: string;
    holderName: string;
    expiryOrIssueDate: string;
    cvv?: string;
    balance: number;
    dailyLimit: number;
    status: string;
  }[];
}

export interface SaveCardsToSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  folderId: string;
  folderName: string;
  savedCards: number;
  message: string;
}

export interface GoogleDriveStatusResult {
  connected: boolean;
  state?: string;
  folderId?: string;
  folderName?: string;
}

export async function getGoogleDriveStatus(api: HttpClient): Promise<GoogleDriveStatusResult> {
  try {
    const res = await api.get<any>('/cardflow-backend/v1/drive/actions/status');
    return (res?.data || res) as GoogleDriveStatusResult;
  } catch (err: any) {
    if (err && typeof err === 'object') {
      const raw = err.body || err.response || err.data;
      if (raw && typeof raw === 'object' && ('connected' in raw || ('data' in raw && 'connected' in raw.data))) {
        return (raw.data || raw) as GoogleDriveStatusResult;
      }
    }
    return { connected: false };
  }
}

export async function saveCardsToSheet(api: HttpClient, input: SaveCardsToSheetInput): Promise<SaveCardsToSheetResult> {
  try {
    const res = await api.post<any>('/cardflow-backend/v1/sheet/actions/save-cards', input);
    return (res?.data || res) as SaveCardsToSheetResult;
  } catch (err: any) {
    if (err && typeof err === 'object') {
      const raw = err.body || err.response || err.data;
      if (raw && typeof raw === 'object') {
        const item = raw.data || raw;
        if (item && item.spreadsheetId) {
          return item as SaveCardsToSheetResult;
        }
      }
      const msg = err.message || '';
      const match = msg.match(/nhận:\s*(\{.*\})/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          const item = parsed.data || parsed;
          if (item && item.spreadsheetId) {
            return item as SaveCardsToSheetResult;
          }
        } catch {}
      }
    }
    throw err;
  }
}

// ── Google Drive & Sheets Integration Contract & API (Collab) ─────────
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

  create: (api: HttpClient, data: any) =>
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
  connect: async (api: HttpClient): Promise<GoogleConnectResponse> => {
    try {
      const res = await api.get<any>('/cardflow-backend/v1/drive/actions/connect');
      const item = res?.data || res;
      if (item && item.authUrl) {
        return item as GoogleConnectResponse;
      }
      return item as GoogleConnectResponse;
    } catch (err: any) {
      if (err && typeof err === 'object') {
        const raw = err.body || err.response || err.data;
        if (raw && typeof raw === 'object') {
          const item = raw.data || raw;
          if (item && item.authUrl) return item as GoogleConnectResponse;
        }
        const msg = err.message || '';
        const match = msg.match(/nhận:\s*(\{.*\})/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            const item = parsed.data || parsed;
            if (item && item.authUrl) return item as GoogleConnectResponse;
          } catch {}
        }
      }
      throw err;
    }
  },

  listFiles: (api: HttpClient, state: string) =>
    api.get<GoogleDriveFile[]>(`/cardflow-backend/v1/drive/actions/files?state=${encodeURIComponent(state)}`),

  getImported: (api: HttpClient, state: string) =>
    api.get<GoogleDriveFile[]>(`/cardflow-backend/v1/drive/actions/imported?state=${encodeURIComponent(state)}`),

  upload: (api: HttpClient, payload: GoogleUploadInput) =>
    api.post<GoogleDriveFile>('/cardflow-backend/v1/drive/actions/upload', payload),

  sync: (api: HttpClient, state: string) =>
    api.post<GoogleSyncResponse>('/cardflow-backend/v1/drive/actions/sync', { state }),

  deleteFile: (api: HttpClient, payload: { state: string; fileId: string }) =>
    safeRequest<{ success: boolean; fileId: string }>(() =>
      api.post('/cardflow-backend/v1/drive/actions/delete', payload)
    ),
};

async function safeRequest<T>(req: () => Promise<any>): Promise<T> {
  try {
    const res = await req();
    return (res?.data !== undefined ? res.data : res) as T;
  } catch (err: any) {
    if (err && typeof err === 'object') {
      const raw = err.body || err.response || err.data;
      if (raw !== undefined) {
        return (raw?.data !== undefined ? raw.data : raw) as T;
      }
      const msg = err.message || '';
      const match = msg.match(/nhận:\s*(\{.*\}|\[.*\])/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          return (parsed?.data !== undefined ? parsed.data : parsed) as T;
        } catch {}
      }
    }
    throw err;
  }
}

export const googleSheetApi = {
  create: (api: HttpClient, payload: { state: string; title: string }) =>
    safeRequest<GoogleSheetResponse>(() =>
      api.post('/cardflow-backend/v1/sheet/actions/create', payload)
    ),

  append: (api: HttpClient, payload: AppendRowsInput) =>
    safeRequest<AppendRowsResponse>(() =>
      api.post('/cardflow-backend/v1/sheet/actions/append', payload)
    ),

  readRows: (api: HttpClient, params: { state: string; spreadsheetId: string; range?: string }) => {
    const qs = new URLSearchParams({
      state: params.state,
      spreadsheetId: params.spreadsheetId,
      ...(params.range ? { range: params.range } : {}),
    });
    return safeRequest<ReadRowsResponse>(() =>
      api.get(`/cardflow-backend/v1/sheet/actions/read?${qs.toString()}`)
    );
  },

  importSheet: (api: HttpClient, payload: ImportSheetInput) =>
    safeRequest<ImportSheetResponse>(() =>
      api.post('/cardflow-backend/v1/sheet/actions/import', payload)
    ),
};


