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

  it('returns false while the modal is closed', () => {
    const isDirty = checkIsDirty({
      event: undefined,
      title: 'Something',
      description: '',
      participants: [],
      icon: 'flight',
      open: false,
    });

    expect(isDirty).toBe(false);
  });

  it('returns true for a new form once a title is typed', () => {
    const participants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice' }];

    const isDirty = checkIsDirty({
      event: undefined,
      title: 'Trip',
      description: '',
      participants,
      icon: 'flight',
      open: true,
      userId: 'u1',
    });

    expect(isDirty).toBe(true);
  });

  it('returns false in edit mode when only contribution targets differ', () => {
    // Targets are edited from the Money section; a target-only difference must never trigger the
    // discard prompt of the event form.
    const eventWithTarget: Event = {
      ...baseEvent,
      participants: [{ type: 'user', id: 'u1', name: 'Alice', contributionTarget: 25 }],
    };
    const participants: EventParticipant[] = [{ type: 'user', id: 'u1', name: 'Alice' }];

    const isDirty = checkIsDirty({
      event: eventWithTarget,
      title: 'Trip',
      description: 'Weekend trip',
      participants,
      icon: 'flight',
      open: true,
    });

    expect(isDirty).toBe(false);
  });

  it('returns true when a guest is renamed in edit mode', () => {
    const eventWithGuest: Event = {
      ...baseEvent,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest One' }],
    };
    const participants: EventParticipant[] = [{ type: 'guest', id: 'g1', name: 'Guest Two' }];

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

  it('returns true when a participant is added in edit mode', () => {
    const participants: EventParticipant[] = [
      { type: 'user', id: 'u1', name: 'Alice' },
      { type: 'guest', id: 'g1', name: 'Guest One' },
    ];

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

  it('returns true when a participant is replaced in edit mode', () => {
    const participants: EventParticipant[] = [{ type: 'user', id: 'u2', name: 'Bob' }];

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
});
