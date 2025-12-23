import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDateLong } from './formatDateLong';
import i18n from '@/i18n';

/**
 * Tests for the formatDateLong utility
 * Used to display dates in long format using the current language
 */
describe('formatDateLong', () => {
  beforeEach(() => {
    // Reset to Spanish by default
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('es');
  });

  describe('Spanish locale', () => {
    it('should format a date in long Spanish format', () => {
      const result = formatDateLong('2025-01-15');
      
      // Check that it contains the expected parts
      expect(result).toContain('2025');
      expect(result).toContain('enero'); // January in Spanish
      expect(result).toContain('15');
    });

    it('should include weekday in the output', () => {
      // 2025-01-15 is a Wednesday (miércoles)
      const result = formatDateLong('2025-01-15');
      expect(result).toContain('miércoles');
    });

    it('should format different months correctly', () => {
      const resultJan = formatDateLong('2025-01-01');
      const resultDec = formatDateLong('2025-12-25');
      
      expect(resultJan).toContain('enero');
      expect(resultDec).toContain('diciembre');
    });

    it('should format all components together correctly', () => {
      // 2025-12-23 is a Tuesday (martes)
      const result = formatDateLong('2025-12-23');
      
      // Should contain all parts
      expect(result).toContain('martes');
      expect(result).toContain('23');
      expect(result).toContain('diciembre');
      expect(result).toContain('2025');
    });
  });

  describe('English locale', () => {
    beforeEach(() => {
      vi.spyOn(i18n, 'language', 'get').mockReturnValue('en');
    });

    it('should format a date in long English format', () => {
      const result = formatDateLong('2025-01-15');
      
      expect(result).toContain('2025');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    it('should include weekday in English', () => {
      // 2025-01-15 is a Wednesday
      const result = formatDateLong('2025-01-15');
      expect(result).toContain('Wednesday');
    });
  });

  describe('Catalan locale', () => {
    beforeEach(() => {
      vi.spyOn(i18n, 'language', 'get').mockReturnValue('ca');
    });

    it('should format a date in long Catalan format', () => {
      const result = formatDateLong('2025-01-15');
      
      expect(result).toContain('2025');
      expect(result).toContain('gener'); // January in Catalan
      expect(result).toContain('15');
    });

    it('should include weekday in Catalan', () => {
      // 2025-01-15 is a Wednesday (dimecres)
      const result = formatDateLong('2025-01-15');
      expect(result).toContain('dimecres');
    });
  });

  describe('Common scenarios', () => {
    it('should handle different years', () => {
      const result2024 = formatDateLong('2024-06-15');
      const result2025 = formatDateLong('2025-06-15');
      
      expect(result2024).toContain('2024');
      expect(result2025).toContain('2025');
    });

    it('should handle single digit days', () => {
      const result = formatDateLong('2025-03-05');
      expect(result).toContain('5');
      expect(result).toContain('marzo');
    });

    it('should handle end of month dates', () => {
      const result = formatDateLong('2025-01-31');
      expect(result).toContain('31');
      expect(result).toContain('enero');
    });

    it('should handle leap year dates', () => {
      // 2024 is a leap year
      const result = formatDateLong('2024-02-29');
      expect(result).toContain('29');
      expect(result).toContain('febrero');
      expect(result).toContain('2024');
    });
  });
});
