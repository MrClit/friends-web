import { getCurrentLocale } from '@/i18n';

/**
 * Format date in short format using current locale
 * @param dateStr - ISO date string
 * @returns Formatted date string (e.g., "19 feb. 2026")
 */
export function formatDateShort(dateStr: string): string {
  // Validate input
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }

  const date = new Date(dateStr);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(getCurrentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
