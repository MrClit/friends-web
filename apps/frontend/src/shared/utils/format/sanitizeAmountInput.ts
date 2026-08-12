const MAX_DECIMALS = 2;

/**
 * Normalizes raw text typed into a money field so it can be parsed with `parseFloat`.
 *
 * Money inputs cannot rely on `<input type="number">`: Safari on iOS parses the value with the
 * system locale and reports an empty string while a decimal is half typed, so the React state and
 * the text painted on screen drift apart and the form looks filled while it is not. Keeping the
 * field as text and sanitizing here makes both platforms behave the same.
 *
 * Accepts either separator, keeps at most one decimal point and truncates to two decimals.
 * Partial values such as `'12.'` are preserved so the user can keep typing.
 */
export function sanitizeAmountInput(rawValue: string): string {
  const normalized = rawValue.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [integerPart = '', ...decimalParts] = normalized.split('.');

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join('').slice(0, MAX_DECIMALS)}`;
}
