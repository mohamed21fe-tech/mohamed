/**
 * Formatting utilities for Syrian Restaurant POS
 */

export function formatCurrency(amount: number, currency = 'SYP', symbol = 'ل.س'): string {
  if (isNaN(amount)) amount = 0;
  // Syrian Pound formatted with locale separators
  const formatted = Math.round(amount).toLocaleString('ar-SY');
  return `${formatted} ${symbol}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ar-SY');
}

export function formatOrderNumber(num: number): string {
  return `#${num}`;
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('ar-SY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function getElapsedTimeMinutes(isoString?: string): number {
  if (!isoString) return 0;
  const diffMs = Date.now() - new Date(isoString).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}
