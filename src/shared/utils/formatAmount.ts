export function formatAmount(amount: number, currency: string = 'EUR', locale: string = 'es-ES') {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
