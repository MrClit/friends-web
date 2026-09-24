import { describe, expect, it } from 'vitest';
import type { EventParticipant } from '../types';
import {
  haveSameContributionTargets,
  parseContributionTargetInput,
  withContributionTarget,
} from './contributionTargets';

const user = (id: string, target?: number): EventParticipant => ({
  type: 'user',
  id,
  ...(target !== undefined && { contributionTarget: target }),
});
const guest = (id: string, target?: number): EventParticipant => ({
  type: 'guest',
  id,
  name: `Guest ${id}`,
  ...(target !== undefined && { contributionTarget: target }),
});
const pot: EventParticipant = { type: 'pot', id: '0' };

describe('withContributionTarget', () => {
  it('sets a non-zero target', () => {
    expect(withContributionTarget(user('a'), 15)).toEqual({ type: 'user', id: 'a', contributionTarget: 15 });
  });

  it('removes the key when the target is zero', () => {
    expect(withContributionTarget(user('a', 10), 0)).not.toHaveProperty('contributionTarget');
  });

  it('removes the key when the target is undefined', () => {
    expect(withContributionTarget(guest('g', 10), undefined)).not.toHaveProperty('contributionTarget');
  });

  it('removes the key when the target is not finite', () => {
    expect(withContributionTarget(user('a', 10), Number.NaN)).not.toHaveProperty('contributionTarget');
  });

  it('returns the pot untouched by reference', () => {
    expect(withContributionTarget(pot, 15)).toBe(pot);
  });

  it('does not mutate the original participant', () => {
    const original = user('a', 10);
    withContributionTarget(original, 20);
    expect(original).toEqual({ type: 'user', id: 'a', contributionTarget: 10 });
  });
});

describe('parseContributionTargetInput', () => {
  it('returns undefined for an empty value', () => {
    expect(parseContributionTargetInput('')).toBeUndefined();
    expect(parseContributionTargetInput('   ')).toBeUndefined();
  });

  it('returns undefined for a non-numeric value', () => {
    expect(parseContributionTargetInput('abc')).toBeUndefined();
  });

  it('clamps negative values to zero', () => {
    expect(parseContributionTargetInput('-5')).toBe(0);
  });

  it('rounds to two decimals', () => {
    expect(parseContributionTargetInput('12.345')).toBe(12.35);
    expect(parseContributionTargetInput('12.344')).toBe(12.34);
  });

  it('trims surrounding whitespace', () => {
    expect(parseContributionTargetInput(' 7 ')).toBe(7);
  });
});

describe('haveSameContributionTargets', () => {
  it('is true for identical targets', () => {
    expect(haveSameContributionTargets([user('a', 10), pot], [user('a', 10), pot])).toBe(true);
  });

  it('treats a missing target and zero as the same', () => {
    expect(haveSameContributionTargets([user('a')], [user('a', 0)])).toBe(true);
  });

  it('detects a changed target', () => {
    expect(haveSameContributionTargets([user('a', 10)], [user('a', 20)])).toBe(false);
  });

  it('detects a removed target', () => {
    expect(haveSameContributionTargets([user('a', 10)], [user('a')])).toBe(false);
  });

  it('is false when the lengths differ', () => {
    expect(haveSameContributionTargets([user('a')], [user('a'), pot])).toBe(false);
  });
});
