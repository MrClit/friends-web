import type { EventParticipant } from '../types';

/** Sum of the contribution targets of every user and guest participant. The pot has no target. */
export function sumContributionTargets(participants: EventParticipant[]): number {
  return participants.reduce((sum, participant) => {
    if (participant.type === 'user' || participant.type === 'guest') {
      return sum + (participant.contributionTarget ?? 0);
    }

    return sum;
  }, 0);
}

/**
 * Returns the participant with the given target applied.
 * A missing, zero or non-finite target removes the key: "no target" is the absence of the property,
 * not a zero, so the pending KPI and the dirty check treat both the same way.
 * The pot is returned untouched.
 */
export function withContributionTarget(participant: EventParticipant, target: number | undefined): EventParticipant {
  if (participant.type === 'pot') return participant;

  if (target === undefined || !Number.isFinite(target) || target === 0) {
    const { contributionTarget: _, ...rest } = participant;
    return rest;
  }

  return { ...participant, contributionTarget: target };
}

/**
 * Parses the raw value of a target input: two decimals, never negative, `undefined` when empty or
 * not a number.
 */
export function parseContributionTargetInput(raw: string): number | undefined {
  const value = raw.trim();
  if (value === '') return undefined;

  const parsed = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(parsed)) return undefined;

  return parsed < 0 ? 0 : parsed;
}

/** Position-by-position comparison of targets, treating a missing target and zero as the same. */
export function haveSameContributionTargets(a: EventParticipant[], b: EventParticipant[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((participant, index) => targetOf(participant) === targetOf(b[index]));
}

function targetOf(participant: EventParticipant | undefined): number {
  if (!participant || participant.type === 'pot') return 0;
  return participant.contributionTarget ?? 0;
}
