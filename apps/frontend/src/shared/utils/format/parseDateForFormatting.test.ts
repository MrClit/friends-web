import { describe, expect, it } from 'vitest';
import { formatDateToInputValue, parseDateForFormatting } from './parseDateForFormatting';

describe('parseDateForFormatting', () => {
  it('returns null for invalid input', () => {
    expect(parseDateForFormatting('')).toBeNull();
    expect(parseDateForFormatting('not-a-date')).toBeNull();
  });

  it('parses YYYY-MM-DD as a local calendar date', () => {
    const parsed = parseDateForFormatting('2025-01-15');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2025);
    expect(parsed?.getMonth()).toBe(0);
    expect(parsed?.getDate()).toBe(15);
  });

  it('returns null for impossible calendar dates', () => {
    expect(parseDateForFormatting('2025-02-30')).toBeNull();
  });

  it('parses ISO datetime strings', () => {
    const parsed = parseDateForFormatting('2025-01-15T10:30:00.000Z');

    expect(parsed).not.toBeNull();
    expect(Number.isNaN(parsed?.getTime() ?? NaN)).toBe(false);
  });
});

describe('formatDateToInputValue', () => {
  it('formats local Date objects as YYYY-MM-DD with zero padding', () => {
    const date = new Date(2025, 0, 5);

    expect(formatDateToInputValue(date)).toBe('2025-01-05');
  });
});
