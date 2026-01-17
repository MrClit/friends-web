import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatAmount } from './formatAmount';
import i18n from '@/i18n';

/**
 * Tests for the formatAmount utility
 * Used to display currency values using the current language locale
 */
describe('formatAmount', () => {
  beforeEach(() => {
    // Reset to Spanish by default
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('es');
  });

  describe('Spanish locale (es-ES)', () => {
    it('should format amount with default EUR currency', () => {
      const result = formatAmount(1234.56);
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    it('should format amount with custom currency', () => {
      const result = formatAmount(1000, 'USD');
      expect(result).toContain('1.000,00');
      expect(result).toMatch(/US\$/);
    });

    it('should handle zero amount', () => {
      const result = formatAmount(0);
      expect(result).toContain('0,00');
      expect(result).toContain('€');
    });

    it('should handle negative amounts', () => {
      const result = formatAmount(-500.75);
      expect(result).toContain('-500,75');
      expect(result).toContain('€');
    });

    it('should format without grouping when specified', () => {
      const result = formatAmount(1234.56, 'EUR', false);
      expect(result).toContain('1234,56');
      expect(result).not.toContain('1.234');
    });

    it('should always show 2 decimal places', () => {
      const result = formatAmount(100);
      expect(result).toContain('100,00');
    });

    it('should round to 2 decimal places', () => {
      const result = formatAmount(10.999);
      expect(result).toContain('11,00');
    });
  });

  describe('English locale (en-US)', () => {
    beforeEach(() => {
      vi.spyOn(i18n, 'language', 'get').mockReturnValue('en');
    });

    it('should format amount with default EUR currency', () => {
      const result = formatAmount(1234.56);
      expect(result).toContain('1,234.56');
      expect(result).toContain('€');
    });

    it('should use dot as decimal separator', () => {
      const result = formatAmount(100.5);
      expect(result).toContain('100.50');
    });

    it('should use comma as thousands separator', () => {
      const result = formatAmount(1000000);
      expect(result).toContain('1,000,000');
    });
  });

  describe('Catalan locale (ca-ES)', () => {
    beforeEach(() => {
      vi.spyOn(i18n, 'language', 'get').mockReturnValue('ca');
    });

    it('should format amount with default EUR currency', () => {
      const result = formatAmount(1234.56);
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    it('should use comma as decimal separator', () => {
      const result = formatAmount(100.5);
      expect(result).toContain('100,50');
    });
  });
});
