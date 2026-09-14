import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Event, EventParticipant } from '../types';
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
});
