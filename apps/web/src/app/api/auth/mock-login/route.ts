// Mock login handler — CHỈ HOẠT ĐỘNG KHI NODE_ENV !== 'production'.
//
// Nhận thông tin tài khoản qua query params hoặc body, sinh TokenSet giả bằng
// mock-auth.ts, ghi cookie phiên bằng cùng sessionCookies của production.
// Kết quả: proxy.ts (createSessionProxy) thấy cookie hợp lệ và cho qua /app.
import { NextResponse, type NextRequest } from 'next/server';
import { sessionCookies } from '@/lib/session';
import {
  MOCK_ACCOUNTS,
  buildMockTokenSet,
  buildCustomMockUser,
} from '@/lib/mock-auth';

export function GET(req: NextRequest) {
  // Khoá cứng: không bao giờ chạy trên production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const params = req.nextUrl.searchParams;
  const returnTo = safeReturnTo(params.get('returnTo') ?? '/app');

  // Chọn tài khoản mẫu theo index (0-based), hoặc nhập thủ công.
  const accountIndex = params.get('account');
  const customName = params.get('name');
  const customEmail = params.get('email');

  let user;
  if (customName && customEmail) {
    user = buildCustomMockUser({
      name: customName,
      email: customEmail,
      role: params.get('role') ?? 'cardholder',
      tenantId: params.get('tenantId') ?? 'tenant-default',
    });
  } else {
    const idx = accountIndex != null ? parseInt(accountIndex, 10) : 0;
    const safeIdx = Number.isNaN(idx) ? 0 : Math.min(Math.max(idx, 0), MOCK_ACCOUNTS.length - 1);
    user = MOCK_ACCOUNTS[safeIdx] ?? MOCK_ACCOUNTS[0];
  }

  if (!user) {
    return NextResponse.json({ error: 'no_mock_accounts' }, { status: 500 });
  }

  const tokens = buildMockTokenSet(user);

  const res = NextResponse.redirect(new URL(returnTo, req.url));
  sessionCookies.write(res.cookies, tokens);
  sessionCookies.writeTenant(res.cookies, user.tenantId);
  sessionCookies.writeRealm(res.cookies, user.realm);
  return res;
}

function safeReturnTo(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/app';
}
