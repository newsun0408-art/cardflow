// Bộ token của Cardflow app. Kit khai VAI TRÒ, file này khai GIÁ TRỊ.
// Tuân thủ quy chuẩn Frontend AI (Impeccable) & fe-kit/ui.
import { defineTokens, type ThemeMode } from 'fe-kit/ui';

export function tokensFor(mode: ThemeMode) {
  return defineTokens(mode, {
    color:
      mode === 'dark'
        ? {
            primary: '#38bdf8',
            background: '#090d16',
            surface: '#0f172a',
            surfaceMuted: '#1e293b',
            text: '#f8fafc',
            textMuted: '#94a3b8',
            border: '#1e293b',
            borderStrong: '#38bdf8',
            success: '#4ade80',
            warning: '#fbbf24',
            danger: '#f87171',
            info: '#38bdf8',
          }
        : {
            primary: '#0284c7',
            background: '#f8fafc',
            surface: '#ffffff',
            surfaceMuted: '#f1f5f9',
            text: '#0f172a',
            textMuted: '#64748b',
            border: '#e2e8f0',
            borderStrong: '#0284c7',
            success: '#16a34a',
            warning: '#d97706',
            danger: '#dc2626',
            info: '#0284c7',
          },
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      pill: 999,
    },
    typography: {
      fontFamily:
        "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontFamilyMono:
        "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    },
  });
}

// Token tĩnh mặc định tiện sử dụng cho Cardflow App Dark Theme
export const cardflowDarkTokens = tokensFor('dark');
