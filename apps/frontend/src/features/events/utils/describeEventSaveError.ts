import type { TFunction } from 'i18next';
import { ApiError } from '@/api/client';
import { getApiErrorMessage } from '@/shared/utils';
import type { EventParticipant } from '../types';

/**
 * The message for a failed save of the event form. A 422 whose details carry `userIds` means those users
 * are not members of the event's group, so it names them as the form shows them; anything else falls back
 * to the generic status message.
 */
export function describeEventSaveError(error: unknown, participants: EventParticipant[], t: TFunction): string {
  const userIds = error instanceof ApiError && error.status === 422 ? error.details?.userIds : undefined;
  if (!Array.isArray(userIds) || userIds.length === 0) return getApiErrorMessage(error, t);

  const names = userIds.map((id) => {
    const participant = participants.find((p) => p.type === 'user' && p.id === id);
    return participant?.type === 'user' ? participant.name || participant.email || String(id) : String(id);
  });

  return t('eventForm.notMembers', { ns: 'events', names: names.join(', ') });
}
