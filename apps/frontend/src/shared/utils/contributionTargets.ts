import type { EventParticipantDto } from '@/api/types';

/** Sum of the contribution targets of every user and guest participant. The pot has no target. */
export function sumContributionTargets(participants: EventParticipantDto[]): number {
  return participants.reduce((sum, participant) => {
    if (participant.type === 'user' || participant.type === 'guest') {
      return sum + (participant.contributionTarget ?? 0);
    }

    return sum;
  }, 0);
}
