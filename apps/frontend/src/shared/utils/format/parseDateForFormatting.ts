const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDateToInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date strings safely for UI formatting.
 *
 * - `YYYY-MM-DD` is treated as a local calendar date to avoid UTC shifts.
 * - Other ISO-like strings are parsed with native Date semantics.
 */
export function parseDateForFormatting(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const dateOnlyMatch = DATE_ONLY_REGEX.exec(dateStr);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);

    const localDate = new Date(year, monthIndex, day);

    if (localDate.getFullYear() !== year || localDate.getMonth() !== monthIndex || localDate.getDate() !== day) {
      return null;
    }

    return localDate;
  }

  const parsedDate = new Date(dateStr);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}
