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

