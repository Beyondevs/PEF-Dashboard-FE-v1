export const PAKISTAN_TIME_ZONE = 'Asia/Karachi';

/**
 * Format a date into **dd/MM/yyyy** in a stable way (not affected by browser locale),
 * and optionally lock the timezone (default: Pakistan).
 */
export function formatDateDDMMYYYY(
  value: string | Date | null | undefined,
  options?: { timeZone?: string },
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const timeZone = options?.timeZone ?? PAKISTAN_TIME_ZONE;

  try {
    // en-GB produces dd/MM/yyyy order.
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    // Fallback: best-effort without timezone lock.
    return date.toLocaleDateString('en-GB');
  }
}


