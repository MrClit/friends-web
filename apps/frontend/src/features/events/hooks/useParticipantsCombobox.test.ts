import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GroupMember } from '@/api/groups.api';
import type { EventParticipant } from '../types';
import { useParticipantsCombobox } from './useParticipantsCombobox';

const members: GroupMember[] = [
  { id: 'u1', name: 'Alice', email: 'alice@example.com', avatar: null },
  { id: 'u2', name: 'Bob', email: 'bob@work.com', avatar: null },
  { id: 'u3', name: null, email: 'carol@example.com', avatar: null },
];

const useGroupMembers = vi.fn((groupId: string | undefined) => ({
  data: groupId ? members : undefined,
  isLoading: false,
}));

vi.mock('@/hooks/api/useGroups', () => ({
  useGroupMembers: (groupId: string | undefined) => useGroupMembers(groupId),
}));

const alice: EventParticipant = { type: 'user', id: 'u1', name: 'Alice', email: 'alice@example.com' };

function renderCombobox(props: { groupId?: string; inputValue?: string; onSelect?: (p: EventParticipant) => void }) {
  return renderHook(() =>
    useParticipantsCombobox({
      groupId: props.groupId ?? 'group-1',
      existingParticipants: [alice],
      inputValue: props.inputValue ?? '',
      onInputChange: vi.fn(),
      onSelect: props.onSelect ?? vi.fn(),
    }),
  );
}

describe('useParticipantsCombobox', () => {
  it('offers the members of the group that are not participants yet', () => {
    const { result } = renderCombobox({});

    expect(useGroupMembers).toHaveBeenCalledWith('group-1');
    expect(result.current.filteredUsers.map((u) => u.id)).toEqual(['u2', 'u3']);
  });

  it('filters the members by name and by email', () => {
    expect(renderCombobox({ inputValue: 'bo' }).result.current.filteredUsers.map((u) => u.id)).toEqual(['u2']);
    expect(renderCombobox({ inputValue: 'carol@' }).result.current.filteredUsers.map((u) => u.id)).toEqual(['u3']);
  });

  it('asks for nothing until there is a group', () => {
    const { result } = renderCombobox({ groupId: '' });

    expect(useGroupMembers).toHaveBeenLastCalledWith(undefined);
    expect(result.current.filteredUsers).toEqual([]);
  });

  it('adds a member without a name under their email', () => {
    const onSelect = vi.fn();
    const { result } = renderCombobox({ onSelect });

    act(() => result.current.handleSelectUser(members[2]));

    expect(onSelect).toHaveBeenCalledWith({
      id: 'u3',
      type: 'user',
      name: 'carol@example.com',
      email: 'carol@example.com',
      avatar: undefined,
    });
  });
});
