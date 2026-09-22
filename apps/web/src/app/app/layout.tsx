// Layout cho khu vực đã đăng nhập (/app/**).
//
// Server Component: đọc cookie phiên một lần ở đây, decode thông tin user,
// rồi truyền xuống AppShell (Client Component) dưới dạng plain props.
// Các trang con KHÔNG cần tự đọc session nữa (trừ khi cần data riêng).
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { sessionCookies } from '@/lib/session';
import { decodeJwtPayload } from 'fe-kit/auth';
import { AppShell } from './_components/AppShell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = sessionCookies.read(await cookies());

  const payload = session.accessToken
    ? decodeJwtPayload<{ name?: string; email?: string; role?: string }>(session.accessToken)
    : null;

  return (
    <AppShell
      userName={payload?.name ?? 'Người dùng'}
      userEmail={payload?.email ?? ''}
      userRole={payload?.role ?? ''}
      tenantId={session.tenantId ?? ''}
    >
      {children}
    </AppShell>
  );
}
