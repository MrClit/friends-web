import { getCurrentLocale } from '@/i18n';

/**
 * Format date in long format using current locale
 * @param dateStr - ISO date string
 * @returns Formatted date string (e.g., "12 de febrero de 2026")
 */
export function formatDateLong(dateStr: string): string {
  // Validate input
  if (!dateStr || typeof dateStr !== 'string') {
    console.warn('formatDateLong: Invalid input', dateStr);
    return '';
  }

  const date = new Date(dateStr);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('formatDateLong: Invalid date string', dateStr);
    return '';
  }

  const formatted = date.toLocaleDateString(getCurrentLocale(), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formatted;
}
