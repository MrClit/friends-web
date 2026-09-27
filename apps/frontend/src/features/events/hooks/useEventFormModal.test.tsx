import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@/api/client';
import type { Group, GroupMember } from '@/api/groups.api';
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
const auth: { user: { id: string; name: string; email: string; role: 'admin' | 'user' } } = {
  user: { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' },
};

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => auth,
}));

const updateMutation = { mutate: vi.fn(), isPending: false };
const createMutation = { mutate: vi.fn(), isPending: false };
const eventQuery: { data: Event | undefined } = { data: undefined };

const groupsQuery: { data: Group[] } = { data: [] };
const membersByGroup: Record<string, GroupMember[]> = {};
const queryClient = {
  fetchQuery: vi.fn(({ queryKey }: { queryKey: readonly unknown[] }) =>
    Promise.resolve(membersByGroup[queryKey[1] as string] ?? []),
  ),
};

vi.mock('@/hooks/api/useGroups', () => ({
  useGroups: () => groupsQuery,
  groupMembersQueryOptions: (groupId: string) => ({ queryKey: ['groups', groupId, 'members'] }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => queryClient,
}));

vi.mock('../../../hooks/api/useEvents', () => ({
  useEvent: () => eventQuery,
  useUpdateEvent: () => updateMutation,
  useCreateEvent: () => createMutation,
}));

const event: Event = {
  id: 'event-1',
  groupId: 'group-1',
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
    auth.user.role = 'user';
    groupsQuery.data = [{ id: 'group-1', name: 'Friends' }];
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

  describe('group', () => {
    const member = (id: string, name: string): GroupMember => ({ id, name, email: `${id}@example.com`, avatar: null });

    beforeEach(() => {
      eventQuery.data = undefined;
    });

    function renderCreate() {
      return renderHook(() => useEventFormModal({ open: true, eventId: null, onClose: vi.fn() }));
    }

    it('comes already chosen for a user with a single group and goes in the create payload', () => {
      const { result } = renderCreate();

      expect(result.current.groupId).toBe('group-1');

      act(() => {
        result.current.setTitle('Dinner');
      });
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      const [payload] = createMutation.mutate.mock.calls[0] as [{ groupId: string }];
      expect(payload.groupId).toBe('group-1');
    });

    it('cannot be submitted until a group is chosen when the user has several', () => {
      groupsQuery.data = [
        { id: 'group-1', name: 'Friends' },
        { id: 'group-2', name: 'Work' },
      ];
      const { result } = renderCreate();

      act(() => {
        result.current.setTitle('Dinner');
      });

      expect(result.current.groupId).toBe('');
      expect(result.current.canSubmit).toBe(false);
    });

    it('drops the users that are not in the new group while creating, keeps guests and names who left', async () => {
      groupsQuery.data = [
        { id: 'group-1', name: 'Friends' },
        { id: 'group-2', name: 'Work' },
      ];
      membersByGroup['group-2'] = [member('u1', 'Alice')];
      const { result } = renderCreate();

      act(() => {
        result.current.setParticipants((prev) => [...prev, otherUser, { type: 'guest', id: 'g9', name: 'Cousin' }]);
      });
      await act(async () => {
        await result.current.handleGroupChange('group-2');
      });

      await waitFor(() => expect(result.current.removedByGroupChange).toEqual(['Bob']));
      expect(result.current.participants.map((p) => p.id)).toEqual(['u1', 'g9']);
      expect(result.current.groupId).toBe('group-2');
    });

    it('sends the group on update and leaves the participants alone when the admin moves the event', async () => {
      auth.user.role = 'admin';
      eventQuery.data = event;
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

      expect(result.current.canChangeGroup).toBe(true);

      await act(async () => {
        await result.current.handleGroupChange('group-2');
      });
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      expect(queryClient.fetchQuery).not.toHaveBeenCalled();
      const payload = getUpdatePayload();
      expect(payload.groupId).toBe('group-2');
      expect(payload.participants).toEqual(event.participants);
    });

    it('does not let a normal user change the group of an existing event', () => {
      eventQuery.data = event;
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose: vi.fn() }));

      expect(result.current.canChangeGroup).toBe(false);
      expect(result.current.groupId).toBe('group-1');
    });

    it('names the users the server rejects as non-members and keeps the form open', () => {
      eventQuery.data = event;
      const onClose = vi.fn();
      updateMutation.mutate.mockImplementation((_vars, options: { onError: (error: unknown) => void }) => {
        options.onError(new ApiError(422, 'Unprocessable Entity', 'not members', { userIds: ['u1'] }));
      });
      const { result } = renderHook(() => useEventFormModal({ open: true, eventId: 'event-1', onClose }));

      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      expect(result.current.errorMessage).toBe('eventForm.notMembers');
      expect(onClose).not.toHaveBeenCalled();
      updateMutation.mutate.mockReset();
    });
  });
});
