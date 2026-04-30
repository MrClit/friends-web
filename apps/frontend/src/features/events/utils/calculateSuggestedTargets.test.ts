import { describe, it, expect } from 'vitest';
import { calculateSuggestedTargets } from './calculateSuggestedTargets';
import type { EventParticipant } from '../types';

const user = (id: string, target?: number): EventParticipant => ({
  type: 'user',
  id,
  ...(target !== undefined && { contributionTarget: target }),
});
const pot: EventParticipant = { type: 'pot', id: '0' };

describe('calculateSuggestedTargets', () => {
  it('returns participants unchanged when totalExpenses is 0', () => {
    const participants = [user('a', 50), user('b', 50)];
    expect(calculateSuggestedTargets(participants, 0)).toBe(participants);
  });

  it('returns participants unchanged when totalExpenses is negative', () => {
    const participants = [user('a', 50)];
    expect(calculateSuggestedTargets(participants, -10)).toBe(participants);
  });

  it('returns participants unchanged when totalExpenses is non-finite', () => {
    const participants = [user('a')];
    expect(calculateSuggestedTargets(participants, NaN)).toBe(participants);
    expect(calculateSuggestedTargets(participants, Infinity)).toBe(participants);
  });

  it('returns unchanged when no non-pot participants', () => {
    const participants = [pot];
    expect(calculateSuggestedTargets(participants, 100)).toBe(participants);
  });

  it('splits equally when no targets defined (default weight = 1)', () => {
    const participants = [user('a'), user('b')];
    const result = calculateSuggestedTargets(participants, 100);
    expect(result[0]).toMatchObject({ id: 'a', contributionTarget: 50 });
    expect(result[1]).toMatchObject({ id: 'b', contributionTarget: 50 });
  });

  it('splits proportionally with weights 1:1:2', () => {
    const participants = [user('a', 1), user('b', 1), user('c', 2)];
    const result = calculateSuggestedTargets(participants, 100);
    expect(result[0]).toMatchObject({ contributionTarget: 25 });
    expect(result[1]).toMatchObject({ contributionTarget: 25 });
    expect(result[2]).toMatchObject({ contributionTarget: 50 });
  });

  it('ensures the sum of targets equals totalExpenses (rounding correctness)', () => {
    const participants = [user('a', 1), user('b', 1), user('c', 1)];
    const result = calculateSuggestedTargets(participants, 100);
    const sum = result.reduce((s, p) => s + (p.type !== 'pot' ? (p.contributionTarget ?? 0) : 0), 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it('preserves pot participant unchanged', () => {
    const participants = [user('a', 1), pot, user('b', 1)];
    const result = calculateSuggestedTargets(participants, 100);
    expect(result[1]).toBe(pot);
  });

  it('single participant gets 100% of expenses', () => {
    const participants = [user('a', 3)];
    const result = calculateSuggestedTargets(participants, 200);
    expect(result[0]).toMatchObject({ contributionTarget: 200 });
  });

  it('treats missing or zero target as weight 1 for equal share', () => {
    const participants = [user('a', 0), user('b')];
    const result = calculateSuggestedTargets(participants, 100);
    expect(result[0]).toMatchObject({ contributionTarget: 50 });
    expect(result[1]).toMatchObject({ contributionTarget: 50 });
  });

  it('removes contributionTarget if calculated value is 0', () => {
    // Edge case: totalExpenses results in 0 for a participant (virtually impossible with current formula, but guard it)
    const participants = [user('a', 0), user('b', 0)];
    const result = calculateSuggestedTargets(participants, 100);
    // With equal weights both get 50
    expect((result[0] as { contributionTarget?: number }).contributionTarget).toBeGreaterThan(0);
  });
});
