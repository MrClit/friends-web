import { getCurrentLocale } from '@/i18n';

export function formatAmount(
  amount: number,
  currency: string = 'EUR',
  useGrouping: boolean = true,
) {
  return amount.toLocaleString(getCurrentLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping,
  });
}
