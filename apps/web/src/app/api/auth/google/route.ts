import { NextResponse, type NextRequest } from 'next/server';
import { sessionCookies } from '@/lib/session';
import { buildMockTokenSet } from '@/lib/mock-auth';

// GET /api/auth/google: Redirect to Google OAuth 2.0 Consent Screen
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId) {
    // If client ID is not configured yet, redirect back to login with a clear query parameter
    return NextResponse.redirect(new URL('/login?error=google_not_configured', req.url));
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}

// POST /api/auth/google: Handle Google Identity Services (credential token) or direct verified profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { credential, googleId, email, fullName, avatarUrl } = body;

    // If a Google GIS ID token (credential) was provided, verify it directly with Google
    if (credential) {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!verifyRes.ok) {
        return NextResponse.json({ error: 'Token Google không hợp lệ hoặc đã hết hạn' }, { status: 401 });
      }
      const tokenInfo = await verifyRes.json();
      googleId = tokenInfo.sub;
      email = tokenInfo.email;
      fullName = tokenInfo.name || tokenInfo.given_name || email.split('@')[0];
      avatarUrl = tokenInfo.picture || '';
    }

    if (!googleId && !email) {
      return NextResponse.json({ error: 'Thiếu thông tin tài khoản Google' }, { status: 400 });
    }

    // Call Go Backend
    const gatewayUrl = process.env.API_GATEWAY_URI || 'http://localhost:8080';
    const backendRes = await fetch(`${gatewayUrl}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId,
        email,
        fullName,
        avatarUrl,
      }),
    });

    const result = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: result.message || 'Xác thực Google với máy chủ thất bại' },
        { status: backendRes.status }
      );
    }

    const userData = result.data?.user;
    if (!userData) {
      return NextResponse.json({ error: 'Dữ liệu phản hồi máy chủ không hợp lệ' }, { status: 500 });
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
    return NextResponse.json(
      { error: 'Không thể kết nối đến máy chủ xác thực: ' + (err?.message || '') },
      { status: 500 }
    );
  }
}
