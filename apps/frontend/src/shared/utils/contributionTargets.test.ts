import { describe, expect, it } from 'vitest';
import type { EventParticipantDto } from '@/api/types';
import { sumContributionTargets } from './contributionTargets';

const user = (id: string, target?: number): EventParticipantDto => ({
  type: 'user',
  id,
  ...(target !== undefined && { contributionTarget: target }),
});
const guest = (id: string, target?: number): EventParticipantDto => ({
  type: 'guest',
  id,
  name: `Guest ${id}`,
  ...(target !== undefined && { contributionTarget: target }),
});
const pot: EventParticipantDto = { type: 'pot', id: '0' };

describe('sumContributionTargets', () => {
  it('sums user and guest targets and ignores the pot', () => {
    expect(sumContributionTargets([user('a', 10.5), guest('g', 20), pot])).toBe(30.5);
  });

  it('treats a missing target as zero', () => {
    expect(sumContributionTargets([user('a'), guest('g', 5)])).toBe(5);
  });

  it('returns zero for an empty list', () => {
    expect(sumContributionTargets([])).toBe(0);
  });
});
