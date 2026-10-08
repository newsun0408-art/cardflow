import { NextResponse, type NextRequest } from 'next/server';
import { sessionCookies } from '@/lib/session';
import { buildMockTokenSet } from '@/lib/mock-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, phone } = body;

    const gatewayUrl = process.env.API_GATEWAY_URI || 'http://localhost:8080';
    const backendRes = await fetch(`${gatewayUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, phone }),
    });

    const result = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: result.message || 'Đăng ký không thành công' },
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
