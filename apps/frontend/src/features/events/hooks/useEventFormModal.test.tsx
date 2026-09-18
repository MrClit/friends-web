import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Event, EventParticipant, UpdateEventInput } from '../types';
import { useEventFormModal } from './useEventFormModal';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stable identity: `resetForm` depends on `user`, a fresh object per render would re-seed the form forever.
const auth = { user: { id: 'u1', name: 'Alice', email: 'alice@example.com' } };

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => auth,
}));

const updateMutation = { mutate: vi.fn(), isPending: false };
const createMutation = { mutate: vi.fn(), isPending: false };
const eventQuery: { data: Event | undefined } = { data: undefined };

vi.mock('../../../hooks/api/useEvents', () => ({
  useEvent: () => eventQuery,
  useUpdateEvent: () => updateMutation,
  useCreateEvent: () => createMutation,
}));

const event: Event = {
  id: 'event-1',
  title: 'Trip',
  description: 'Weekend trip',
  icon: 'flight',
  status: 'active',
  participants: [
    { type: 'user', id: 'u1', name: 'Alice', email: 'alice@example.com', contributionTarget: 30 },
    { type: 'guest', id: 'g1', name: 'Guest', contributionTarget: 20 },
    { type: 'pot', id: '0' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastModified: '2026-01-01T00:00:00.000Z',
};

const submitEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

const otherUser: EventParticipant = { type: 'user', id: 'u2', name: 'Bob', email: 'bob@example.com' };

// The hook always sends `participants` on update; narrowing it here keeps the assertions free of `?.`.
type UpdatePayload = UpdateEventInput & { participants: EventParticipant[] };

function getUpdatePayload(): UpdatePayload {
  expect(updateMutation.mutate).toHaveBeenCalledTimes(1);
  const [payload] = updateMutation.mutate.mock.calls[0] as [{ data: UpdatePayload }];
  return payload.data;
}

describe('useEventFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventQuery.data = event;
  });

  it('preserves the contribution targets it cannot edit when saving the event', () => {
    const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

    act(() => {
      result.current.setTitle('Trip renamed');
    });
    act(() => {
      result.current.handleSubmit(submitEvent);
    });

    expect(updateMutation.mutate).toHaveBeenCalledTimes(1);
    const [payload] = updateMutation.mutate.mock.calls[0] as [{ data: { participants: EventParticipant[] } }];
    expect(payload.data.participants).toEqual(event.participants);
  });

  it('adds new participants without a contribution target', () => {
    const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

    act(() => {
      result.current.setParticipants((prev) => [...prev, { type: 'guest', id: 'g2', name: 'Newcomer' }]);
    });
    act(() => {
      result.current.handleSubmit(submitEvent);
    });

    const [payload] = updateMutation.mutate.mock.calls[0] as [{ data: { participants: EventParticipant[] } }];
    expect(payload.data.participants).toHaveLength(4);
    expect(payload.data.participants[3]).toEqual({ type: 'guest', id: 'g2', name: 'Newcomer' });
    expect(payload.data.participants.slice(0, 3)).toEqual(event.participants);
  });

  describe('participant replacements', () => {
    // Mirrors what `useParticipantsList.handleReplaceGuestWithUser` does: swap the guest for the user in
    // place, keeping its contribution target, and record the replacement.
    function replaceGuestWithUser(
      result: { current: ReturnType<typeof useEventFormModal> },
      guestId: string,
      user: EventParticipant,
    ) {
      act(() => {
        result.current.setParticipants((prev) =>
          prev.map((p) =>
            p.type === 'guest' && p.id === guestId ? { ...user, contributionTarget: p.contributionTarget } : p,
          ),
        );
        result.current.setParticipantReplacements((prev) => [...prev, { fromGuestId: guestId, toUserId: user.id }]);
      });
    }

    it('does not send a replacement for a guest added in the same edit session', () => {
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

      act(() => {
        result.current.setParticipants((prev) => [...prev, { type: 'guest', id: 'g2', name: 'Newcomer' }]);
      });
      replaceGuestWithUser(result, 'g2', otherUser);
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      const payload = getUpdatePayload();
      expect(payload.participantReplacements).toBeUndefined();
      expect(payload.participants).toEqual([...event.participants, otherUser]);
    });

    it('sends the replacement of a persisted guest', () => {
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

      replaceGuestWithUser(result, 'g1', otherUser);
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      const payload = getUpdatePayload();
      expect(payload.participantReplacements).toEqual([{ fromGuestId: 'g1', toUserId: 'u2' }]);
      expect(payload.participants[1]).toEqual({ ...otherUser, contributionTarget: 20 });
    });

    it('drops the replacement when the target user is removed afterwards', () => {
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

      replaceGuestWithUser(result, 'g1', otherUser);
      act(() => {
        result.current.setParticipants((prev) => prev.filter((p) => p.id !== 'u2'));
      });
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      const payload = getUpdatePayload();
      expect(payload.participantReplacements).toBeUndefined();
      expect(payload.participants.some((p) => p.id === 'u2')).toBe(false);
    });

    it('does not send a replacement whose target user was already a persisted participant', () => {
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));
      const [alice] = event.participants;

      act(() => {
        result.current.setParticipants((prev) => prev.filter((p) => p.id !== 'u1'));
      });
      replaceGuestWithUser(result, 'g1', { type: 'user', id: 'u1', name: 'Alice', email: 'alice@example.com' });
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      const payload = getUpdatePayload();
      expect(payload.participantReplacements).toBeUndefined();
      expect(payload.participants).toEqual([
        { ...alice, contributionTarget: 20 },
        { type: 'pot', id: '0' },
      ]);
    });
  });
});
