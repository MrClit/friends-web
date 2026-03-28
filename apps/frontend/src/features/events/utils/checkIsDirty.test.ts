import { describe, expect, it } from 'vitest';
import type { Event, EventParticipant } from '../types';
import { checkIsDirty } from './checkIsDirty';

const baseEvent: Event = {
  id: 'event-1',
  title: 'Trip',
  description: 'Weekend trip',
  icon: 'flight',
  status: 'active',
  participants: [{ type: 'user', id: 'u1', name: 'Alice' }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastModified: '2026-01-01T00:00:00.000Z',
};

describe('checkIsDirty', () => {
  it('returns false for a pristine new form', () => {
    const participants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice' }];

    const isDirty = checkIsDirty({
      event: undefined,
      title: '',
      description: '',
      participants,
      icon: 'flight',
      open: true,
      userId: 'u1',
    });

    expect(isDirty).toBe(false);
  });

  it('returns true for a new form when a target is provided', () => {
    const participants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 20 }];

    const isDirty = checkIsDirty({
      event: undefined,
      title: '',
      description: '',
      participants,
      icon: 'flight',
      open: true,
      userId: 'u1',
    });

    expect(isDirty).toBe(true);
  });

  it('returns true when a user target changes in edit mode', () => {
    const participants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 25 }];

    const isDirty = checkIsDirty({
      event: baseEvent,
      title: 'Trip',
      description: 'Weekend trip',
      participants,
      icon: 'flight',
      open: true,
    });

    expect(isDirty).toBe(true);
  });

  it('treats undefined and zero target as equivalent defaults', () => {
    const eventWithZeroTarget: Event = {
      ...baseEvent,
      participants: [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 0 }],
    };
    const participants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice' }];

    const isDirty = checkIsDirty({
      event: eventWithZeroTarget,
      title: 'Trip',
      description: 'Weekend trip',
      participants,
      icon: 'flight',
      open: true,
    });

    expect(isDirty).toBe(false);
  });

  it('returns true when a guest target changes in edit mode', () => {
    const eventWithGuest: Event = {
      ...baseEvent,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest One', contributionTarget: 10 }],
    };
    const participants: EventParticipant[] = [{ type: 'guest', id: 'g1', name: 'Guest One', contributionTarget: 30 }];

    const isDirty = checkIsDirty({
      event: eventWithGuest,
      title: 'Trip',
      description: 'Weekend trip',
      participants,
      icon: 'flight',
      open: true,
    });

    expect(isDirty).toBe(true);
  });
});
