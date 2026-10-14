import type { TFunction } from 'i18next';
import type { EventParticipantDto } from '@/api/types';

/**
 * Get avatar from participant, safely handling different participant types
 */
export function getParticipantAvatar(participant: EventParticipantDto): string | null | undefined {
  if (participant.type === 'user' && 'avatar' in participant) {
    return participant.avatar ?? null;
  }
  return null;
}

/**
 * Name of the pot, the shared fund. The single source for it in every screen.
 */
export function getPotName(t: TFunction): string {
  return t('potName', { ns: 'common' });
}

/**
 * Get name from participant, handling different participant types
 */
export function getParticipantName(participant: EventParticipantDto, t: TFunction): string {
  if (participant.type === 'guest') {
    return participant.name;
  }
  if (participant.type === 'user' && 'name' in participant) {
    return participant.name || '?';
  }
  if (participant.type === 'pot') {
    return getPotName(t);
  }
  return '?';
}
