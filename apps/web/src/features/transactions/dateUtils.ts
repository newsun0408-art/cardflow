/**
 * Date formatting utilities for Cardflow transactions.
 * Ensures consistent and synchronized date representation across list, edit modal, and analytics.
 */

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatTransactionDate(dateStr?: string, fallback = ''): string {
  if (!dateStr) return fallback;

  const clean = dateStr.trim().split('T')[0] || '';

  let y = 0;
  let m = 0;
  let d = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const parts = clean.split('-').map(Number);
    y = parts[0] ?? 0;
    m = parts[1] ?? 0;
    d = parts[2] ?? 0;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const parts = clean.split('/').map(Number);
    d = parts[0] ?? 0;
    m = parts[1] ?? 0;
    y = parts[2] ?? 0;
  } else {
    return clean || fallback;
  }

  if (y === 0 || m === 0 || d === 0) {
    return clean || fallback;
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  if (y === todayY && m === todayM && d === todayD) {
    return 'Hôm nay';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    y === yesterday.getFullYear() &&
    m === yesterday.getMonth() + 1 &&
    d === yesterday.getDate()
  ) {
    return 'Hôm qua';
  }

  return `${pad(d)}/${pad(m)}/${y}`;
}
