// MOCK AUTH — CHỈ DÙNG TRONG DEV/UAT.
//
// Sinh TokenSet giả lập tương thích hoàn toàn với fe-kit/server sessionCookies.
// Không gọi ra ngoài, không verify chữ ký — chỉ dùng để test giao diện cục bộ.
//
// An toàn: route /api/auth/mock-login kiểm tra NODE_ENV trước khi gọi vào đây;
// trên môi trường prod file này không bao giờ được thực thi.

import type { TokenSet } from 'fe-kit/auth';

export interface MockUser {
  sub: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  realm: string;
}

/** Các tài khoản mẫu có sẵn để test nhanh. */
export const MOCK_ACCOUNTS: MockUser[] = [
  {
    sub: 'mock-admin-001',
    name: 'Nguyễn Quản Trị',
    email: 'admin@cardflow.vn',
    role: 'admin',
    tenantId: 'tenant-default',
    realm: 'cardflow',
  },
  {
    sub: 'mock-user-002',
    name: 'Trần Chủ Thẻ',
    email: 'user@cardflow.vn',
    role: 'cardholder',
    tenantId: 'tenant-default',
    realm: 'cardflow',
  },
  {
    sub: 'mock-corp-003',
    name: 'Lê Doanh Nghiệp',
    email: 'corp@fintech.vn',
    role: 'corp_admin',
    tenantId: 'corp-fintech-01',
    realm: 'cardflow',
  },
];

/**
 * Sinh một JWT giả (algorithm `none`) chứa payload chuẩn.
 * isJwtExpired() của fe-kit đọc được `exp` từ payload này.
 */
function buildMockJwt(payload: Record<string, unknown>): string {
  const header = encodeBase64Url({ alg: 'none', typ: 'JWT' });
  const body = encodeBase64Url(payload);
  // Signature rỗng — chỉ đọc exp, không verify
  return `${header}.${body}.`;
}

/** Route mock chạy trên Node server; Buffer mã hóa UTF-8 cho tên tiếng Việt. */
function encodeBase64Url(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

const EIGHT_HOURS = 60 * 60 * 8;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Tạo TokenSet giả tương thích với fe-kit/server SessionCookies.
 */
export function buildMockTokenSet(user: MockUser): TokenSet {
  const now = Math.floor(Date.now() / 1000);

  const accessPayload = {
    iss: 'http://localhost:3000/mock-issuer',
    sub: user.sub,
    aud: 'cardflow-app-web',
    iat: now,
    exp: now + EIGHT_HOURS,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant_id: user.tenantId,
    realm: user.realm,
  };

  const idPayload = {
    ...accessPayload,
    nonce: `mock-nonce-${now}`,
  };

  const refreshPayload = {
    sub: user.sub,
    iat: now,
    exp: now + THIRTY_DAYS,
    type: 'refresh',
  };

  return {
    access_token: buildMockJwt(accessPayload),
    id_token: buildMockJwt(idPayload),
    refresh_token: buildMockJwt(refreshPayload),
    expires_in: EIGHT_HOURS,
    refresh_expires_in: THIRTY_DAYS,
    token_type: 'Bearer',
    scope: 'openid profile email',
  };
}

/**
 * Tạo MockUser từ form nhập tùy ý (name, email, role, tenantId).
 */
export function buildCustomMockUser(params: {
  name: string;
  email: string;
  role?: string;
  tenantId?: string;
}): MockUser {
  return {
    sub: `mock-custom-${Date.now()}`,
    name: params.name,
    email: params.email,
    role: params.role ?? 'cardholder',
    tenantId: params.tenantId ?? 'tenant-default',
    realm: 'cardflow',
  };
}
