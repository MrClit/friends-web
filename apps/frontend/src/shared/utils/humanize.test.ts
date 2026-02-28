import { describe, expect, it } from 'vitest';
import { humanize } from './humanize';

describe('humanize', () => {
  it('returns empty string for empty input', () => {
    expect(humanize('')).toBe('');
  });

  it('converts underscored words into title-cased labels', () => {
    expect(humanize('directions_car')).toBe('Directions Car');
    expect(humanize('total_balance_amount')).toBe('Total Balance Amount');
  });

  it('capitalizes first letter of plain words as well', () => {
    expect(humanize('already spaced')).toBe('Already Spaced');
  });
});
