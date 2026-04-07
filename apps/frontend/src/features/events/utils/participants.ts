import type { TFunction } from 'i18next';
import type { EventParticipant } from '../types';

/**
 * Get avatar from participant, safely handling different participant types
 */
export function getParticipantAvatar(participant: EventParticipant): string | null | undefined {
  if (participant.type === 'user' && 'avatar' in participant) {
    return participant.avatar ?? null;
  }
  return null;
}

/**
 * Get name from participant, handling different participant types
 */
export function getParticipantName(participant: EventParticipant, t: TFunction): string {
  if (participant.type === 'guest') {
    return participant.name;
  }
  if (participant.type === 'user' && 'name' in participant) {
    return participant.name || '?';
  }
  if (participant.type === 'pot') {
    return t('participantsInput.potName', { ns: 'events' });
  }
  return '?';
}
