import { describe, it, expect } from 'vitest';
import { sanitizeAmountInput } from './sanitizeAmountInput';

/**
 * Tests for the sanitizeAmountInput utility
 * Used to keep money fields typeable on locales that use a comma as decimal separator
 */
describe('sanitizeAmountInput', () => {
  it('should keep a plain integer untouched', () => {
    expect(sanitizeAmountInput('25')).toBe('25');
  });

  it('should keep a well formed decimal untouched', () => {
    expect(sanitizeAmountInput('25.50')).toBe('25.50');
  });

  it('should convert a comma into a decimal point', () => {
    expect(sanitizeAmountInput('25,50')).toBe('25.50');
  });

  it('should preserve a trailing separator so the user can keep typing', () => {
    expect(sanitizeAmountInput('25,')).toBe('25.');
    expect(sanitizeAmountInput('25.')).toBe('25.');
  });

  it('should keep only the first separator', () => {
    expect(sanitizeAmountInput('25.5.7')).toBe('25.57');
    expect(sanitizeAmountInput('25,5,7')).toBe('25.57');
  });

  it('should truncate to two decimals', () => {
    expect(sanitizeAmountInput('25.5678')).toBe('25.56');
  });

  it('should drop any character that is not a digit or a separator', () => {
    expect(sanitizeAmountInput('25,50 €')).toBe('25.50');
    expect(sanitizeAmountInput('-25')).toBe('25');
    expect(sanitizeAmountInput('abc')).toBe('');
  });

  it('should allow a leading separator', () => {
    expect(sanitizeAmountInput(',5')).toBe('.5');
    expect(parseFloat(sanitizeAmountInput(',5'))).toBe(0.5);
  });

  it('should return an empty string for empty input', () => {
    expect(sanitizeAmountInput('')).toBe('');
  });
});
