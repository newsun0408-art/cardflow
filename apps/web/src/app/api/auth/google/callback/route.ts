import { NextResponse, type NextRequest } from 'next/server';
import { sessionCookies } from '@/lib/session';
import { buildMockTokenSet } from '@/lib/mock-auth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const origin = req.nextUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error || 'cancelled')}`, origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=google_missing_credentials', origin));
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to exchange Google token:', tokenData);
      return NextResponse.redirect(new URL('/login?error=google_exchange_failed', origin));
    }

    // 2. Fetch User Profile from Google UserInfo endpoint
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.sub) {
      return NextResponse.redirect(new URL('/login?error=google_profile_failed', origin));
    }

    // 3. Register or Login user in Cardflow Go Backend
    const gatewayUrl = process.env.API_GATEWAY_URI || 'http://localhost:8080';
    const backendRes = await fetch(`${gatewayUrl}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId: profile.sub,
        email: profile.email,
        fullName: profile.name || profile.given_name || profile.email.split('@')[0],
        avatarUrl: profile.picture || '',
      }),
    });

    const result = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || !result.data?.user) {
      console.error('Backend Google Auth failed:', result);
      return NextResponse.redirect(new URL('/login?error=backend_auth_failed', origin));
    }

    const userData = result.data.user;
    const user = {
      sub: userData.id,
      name: userData.fullName,
      email: userData.email,
      role: userData.role || 'cardholder',
      tenantId: 'tenant-default',
      realm: 'cardflow',
    };

    const tokens = buildMockTokenSet(user);
    const redirectUrl = new URL('/dashboard', origin);
    const res = NextResponse.redirect(redirectUrl);

    sessionCookies.write(res.cookies, tokens);
    sessionCookies.writeTenant(res.cookies, user.tenantId);
    sessionCookies.writeRealm(res.cookies, user.realm);

    return res;
  } catch (err: any) {
    console.error('Error in Google Callback:', err);
    return NextResponse.redirect(new URL('/login?error=callback_exception', origin));
  }
}
