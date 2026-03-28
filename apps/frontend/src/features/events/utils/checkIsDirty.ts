import type { Event, EventParticipant } from '../types';

const DEFAULT_ICON = 'flight';

interface CheckIsDirtyParams {
  event: Event | undefined;
  title: string;
  description: string;
  participants: EventParticipant[];
  icon: string | undefined;
  open: boolean;
  userId?: string;
}

export function checkIsDirty({
  event,
  title,
  description,
  participants,
  icon,
  open,
  userId,
}: CheckIsDirtyParams): boolean {
  if (!open) return false;

  if (!event) {
    const iconDirty = Boolean(icon && icon !== DEFAULT_ICON);

    const hasNonDefaultParticipant = participants.some((p) => {
      if (p.type === 'guest') return Boolean((p.name || '').trim());
      if (p.type === 'pot') return true;
      if (p.type === 'user') {
        if (participants.length === 1 && userId && p.id === userId) return false;
        return true;
      }
      return false;
    });

    // Check if any participant has a non-zero contribution target
    const hasNonZeroTarget = participants.some(
      (p) => (p.type === 'user' || p.type === 'guest') && (p.contributionTarget ?? 0) !== 0,
    );

    return Boolean(title.trim() || description.trim() || hasNonDefaultParticipant || iconDirty || hasNonZeroTarget);
  }

  if (title.trim() !== event.title.trim()) return true;
  if (participants.length !== event.participants.length) return true;

  for (const current of participants) {
    const original = event.participants.find((p) => p.type === current.type && p.id === current.id);
    if (!original) return true;

    if (current.type === 'guest') {
      const curName = (current.name || '').trim();
      const origName = (original.type === 'guest' ? original.name || '' : '').trim();
      if (curName !== origName) return true;

      // Check if contribution target changed
      const curTarget = current.contributionTarget ?? 0;
      const origTarget = original.type === 'guest' ? (original.contributionTarget ?? 0) : 0;
      if (curTarget !== origTarget) return true;
    }

    if (current.type === 'user') {
      // Check if contribution target changed
      const curTarget = current.contributionTarget ?? 0;
      const origTarget = original.type === 'user' ? (original.contributionTarget ?? 0) : 0;
      if (curTarget !== origTarget) return true;
    }
  }

  return false;
}
