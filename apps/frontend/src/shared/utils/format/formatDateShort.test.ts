import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDateShort } from './formatDateShort';
import { i18n } from '@/i18n';

describe('formatDateShort', () => {
  beforeEach(() => {
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('es');
  });

  it('returns empty string for invalid input values', () => {
    expect(formatDateShort('')).toBe('');
    expect(formatDateShort('not-a-date')).toBe('');
    expect(formatDateShort('2025-02-30')).toBe('');
  });

  it('formats dates using Spanish locale by default', () => {
    const result = formatDateShort('2025-01-15');

    expect(result).toContain('15');
    expect(result).toContain('ene');
    expect(result).toContain('2025');
  });

  it('formats dates using English locale when language is en', () => {
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('en');

    const result = formatDateShort('2025-01-15');

    expect(result).toContain('Jan');
    expect(result).toContain('2025');
  });

  it('formats dates using Catalan locale when language is ca', () => {
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('ca');

    const result = formatDateShort('2025-01-15');

    expect(result).toContain('gen');
    expect(result).toContain('2025');
  });
});
