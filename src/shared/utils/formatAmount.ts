export function formatAmount(amount: number, currency: string = 'EUR', useGrouping: boolean = true) {
  return amount.toLocaleString('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping,
  });
}
