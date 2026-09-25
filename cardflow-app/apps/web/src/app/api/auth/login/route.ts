import { startLogin } from 'fe-kit/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { oidcConfig, sessionCookies } from '@/lib/session';
import { buildMockTokenSet } from '@/lib/mock-auth';
import { writeTx } from '../tx';

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/dashboard';
  const realm = req.nextUrl.searchParams.get('realm') ?? undefined;

  const cfg = await oidcConfig(req.nextUrl.origin);
  const { authorizeUrl, tx } = await startLogin(cfg, safeReturnTo(returnTo), realm);

  const res = NextResponse.redirect(authorizeUrl);
  writeTx(res, tx);
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, password } = body;

    const gatewayUrl = process.env.API_GATEWAY_URI || 'http://localhost:8080';
    const backendRes = await fetch(`${gatewayUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier || email, password }),
    });


    const result = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: result.message || 'Tài khoản hoặc mật khẩu không chính xác' },
        { status: backendRes.status }
      );
    }

    const userData = result.data?.user;
    if (!userData) {
      return NextResponse.json({ error: 'Dữ liệu phản hồi không hợp lệ' }, { status: 500 });
    }

    const user = {
      sub: userData.id,
      name: userData.fullName,
      email: userData.email,
      role: userData.role || 'cardholder',
      tenantId: 'tenant-default',
      realm: 'cardflow',
    };

    const tokens = buildMockTokenSet(user);
    const res = NextResponse.json({ success: true, user: userData, token: result.data?.token });

    sessionCookies.write(res.cookies, tokens);
    sessionCookies.writeTenant(res.cookies, user.tenantId);
    sessionCookies.writeRealm(res.cookies, user.realm);

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: 'Không thể kết nối đến máy chủ xác thực: ' + (err?.message || '') }, { status: 500 });
  }
}

function safeReturnTo(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}
