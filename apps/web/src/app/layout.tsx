import type { Metadata } from 'next';
import { cssVariablesBlock } from 'fe-kit/ui';
import { tokensFor } from '@cardflow-app/shared';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Cardflow — Thẻ Cá Nhân Điện Tử Thông Minh',
  description: 'Danh thiếp cá nhân thông minh NFC & 3D Profile Card',
};

// Token ra CSS variable một lần ở đây
const vars = cssVariablesBlock(tokensFor('dark'));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: vars }} />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "'Plus Jakarta Sans', var(--fk-font-family), -apple-system, sans-serif",
          background: 'var(--fk-color-background)',
          color: 'var(--fk-color-text)',
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
