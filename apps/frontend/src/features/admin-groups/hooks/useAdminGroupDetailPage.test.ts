import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import type { AdminGroupMember } from '@/api/admin-groups.api';
import {
  useAddAdminGroupMember,
  useAdminGroupMembers,
  useAdminGroups,
  useRemoveAdminGroupMember,
} from '@/hooks/api/useAdminGroups';

import { useAdminGroupDetailPage } from './useAdminGroupDetailPage';

const addToastMock = vi.fn();
const addMutateAsyncMock = vi.fn();
const removeMutateAsyncMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/hooks/api/useAdminGroups', () => ({
  useAdminGroups: vi.fn(),
  useAdminGroupMembers: vi.fn(),
  useAddAdminGroupMember: vi.fn(),
  useRemoveAdminGroupMember: vi.fn(),
}));

vi.mock('@/shared/store/useToastStore', () => ({
  useToastStore: (selector: (state: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

const member = (id: string, groupCount: number): AdminGroupMember => ({
  id,
  name: `User ${id}`,
  email: `${id}@test.com`,
  avatar: null,
  groupCount,
});

describe('useAdminGroupDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAdminGroups).mockReturnValue({
      data: [{ id: 'group-1', name: 'Amigos', memberCount: 2, createdAt: '', updatedAt: '' }],
      isPending: false,
      isSuccess: true,
      error: null,
    } as never);
    vi.mocked(useAdminGroupMembers).mockReturnValue({
      data: [member('shared', 2), member('only-here', 1)],
      isPending: false,
      error: null,
    } as never);
    vi.mocked(useAddAdminGroupMember).mockReturnValue({
      mutateAsync: addMutateAsyncMock.mockResolvedValue({ success: true }),
      isPending: false,
    } as never);
    vi.mocked(useRemoveAdminGroupMember).mockReturnValue({
      mutateAsync: removeMutateAsyncMock.mockResolvedValue({ success: true }),
      isPending: false,
    } as never);
  });

  it('finds the group in the admin list', () => {
    const { result } = renderHook(() => useAdminGroupDetailPage('group-1'));

    expect(result.current.group?.name).toBe('Amigos');
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.members).toHaveLength(2);
  });

  it('reports a group missing from the loaded list as not found', () => {
    const { result } = renderHook(() => useAdminGroupDetailPage('group-gone'));

    expect(result.current.isNotFound).toBe(true);
  });

  it('reports a 404 on the members as not found rather than as a load error', () => {
    vi.mocked(useAdminGroupMembers).mockReturnValue({
      data: undefined,
      isPending: false,
      error: new ApiError(404, 'Not Found', 'Group not found'),
    } as never);

    const { result } = renderHook(() => useAdminGroupDetailPage('group-1'));

    expect(result.current.isNotFound).toBe(true);
    expect(result.current.loadError).toBeNull();
  });

  it('adds a member to this group', async () => {
    const { result } = renderHook(() => useAdminGroupDetailPage('group-1'));

    await act(async () => {
      await result.current.addMember('new-user');
    });

    expect(addMutateAsyncMock).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'new-user' });
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('removes a member with other groups straight away', async () => {
    const { result } = renderHook(() => useAdminGroupDetailPage('group-1'));

    await act(async () => {
      await result.current.requestRemove(member('shared', 2));
    });

    expect(removeMutateAsyncMock).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'shared' });
    expect(result.current.confirmingRemoval).toBeNull();
  });

  it('asks first before leaving a member without any group', async () => {
    const { result } = renderHook(() => useAdminGroupDetailPage('group-1'));

    await act(async () => {
      await result.current.requestRemove(member('only-here', 1));
    });

    expect(removeMutateAsyncMock).not.toHaveBeenCalled();
    expect(result.current.confirmingRemoval?.id).toBe('only-here');

    await act(async () => {
      await result.current.confirmRemove();
    });

    expect(removeMutateAsyncMock).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'only-here' });
    expect(result.current.confirmingRemoval).toBeNull();
  });

  it('does not remove anyone when the confirmation is cancelled', async () => {
    const { result } = renderHook(() => useAdminGroupDetailPage('group-1'));

    await act(async () => {
      await result.current.requestRemove(member('only-here', 1));
    });
    act(() => {
      result.current.cancelRemove();
    });

    expect(removeMutateAsyncMock).not.toHaveBeenCalled();
    expect(result.current.confirmingRemoval).toBeNull();
  });
});
