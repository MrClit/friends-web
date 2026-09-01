import { describe, it, expect } from 'vitest';
import { expandDateRange } from './expandDateRange';
import { MAX_DAYS_PER_REQUEST } from '../constants';

describe('expandDateRange', () => {
  it('expands an inclusive range', () => {
    expect(expandDateRange('2026-09-12', '2026-09-15')).toEqual([
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
    ]);
  });

  it('returns the single day when both bounds are the same', () => {
    expect(expandDateRange('2026-09-12', '2026-09-12')).toEqual(['2026-09-12']);
  });

  it('returns nothing when the range is inverted', () => {
    expect(expandDateRange('2026-09-15', '2026-09-12')).toEqual([]);
  });

  it('crosses the end of a month', () => {
    expect(expandDateRange('2026-08-30', '2026-09-02')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ]);
  });

  it('crosses the end of a year', () => {
    expect(expandDateRange('2026-12-31', '2027-01-01')).toEqual(['2026-12-31', '2027-01-01']);
  });

  it('includes the 29th of February on a leap year', () => {
    expect(expandDateRange('2028-02-28', '2028-03-01')).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
  });

  // The whole reason the arithmetic is done in UTC: the last Sunday of October is 23 hours long in
  // Europe/Madrid, and adding a local day across it lands on the same date twice.
  it('does not skip or repeat a day across a daylight saving change', () => {
    expect(expandDateRange('2026-10-24', '2026-10-27')).toEqual([
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
    ]);
  });

  it('truncates to the maximum the API accepts', () => {
    const days = expandDateRange('2026-01-01', '2026-12-31');

    expect(days).toHaveLength(MAX_DAYS_PER_REQUEST);
    expect(days[0]).toBe('2026-01-01');
  });

  it('rejects a malformed bound', () => {
    expect(expandDateRange('12-09-2026', '2026-09-15')).toEqual([]);
    expect(expandDateRange('2026-09-12', 'tomorrow')).toEqual([]);
    expect(expandDateRange('', '')).toEqual([]);
  });

  it('rejects a date the pattern allows but the calendar does not have', () => {
    expect(expandDateRange('2026-02-31', '2026-03-02')).toEqual([]);
    expect(expandDateRange('2026-09-12', '2026-13-01')).toEqual([]);
  });
});
