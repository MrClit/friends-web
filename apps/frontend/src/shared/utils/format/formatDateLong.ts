import { getCurrentLocale } from '@/i18n';

export function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(getCurrentLocale(), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
