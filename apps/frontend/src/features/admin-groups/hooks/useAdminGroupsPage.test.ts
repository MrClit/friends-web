import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import type { AdminGroup } from '@/api/admin-groups.api';
import {
  useAdminGroups,
  useCreateAdminGroup,
  useDeleteAdminGroup,
  useRenameAdminGroup,
} from '@/hooks/api/useAdminGroups';

import { useAdminGroupsPage } from './useAdminGroupsPage';

const addToastMock = vi.fn();
const createMutateAsyncMock = vi.fn();
const renameMutateAsyncMock = vi.fn();
const deleteMutateAsyncMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/hooks/api/useAdminGroups', () => ({
  useAdminGroups: vi.fn(),
  useCreateAdminGroup: vi.fn(),
  useRenameAdminGroup: vi.fn(),
  useDeleteAdminGroup: vi.fn(),
}));

vi.mock('@/shared/store/useToastStore', () => ({
  useToastStore: (selector: (state: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

const group: AdminGroup = {
  id: 'group-1',
  name: 'Amigos',
  memberCount: 3,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('useAdminGroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAdminGroups).mockReturnValue({ data: [group], isPending: false, error: null } as never);
    vi.mocked(useCreateAdminGroup).mockReturnValue({
      mutateAsync: createMutateAsyncMock.mockResolvedValue(group),
      isPending: false,
    } as never);
    vi.mocked(useRenameAdminGroup).mockReturnValue({
      mutateAsync: renameMutateAsyncMock.mockResolvedValue(group),
      isPending: false,
    } as never);
    vi.mocked(useDeleteAdminGroup).mockReturnValue({
      mutateAsync: deleteMutateAsyncMock.mockResolvedValue({ success: true }),
      isPending: false,
    } as never);
  });

  it('creates a group with the trimmed name and closes the dialog', async () => {
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.openCreate();
      result.current.setNameInput('  Pádel  ');
    });
    await act(async () => {
      await result.current.submitName();
    });

    expect(createMutateAsyncMock).toHaveBeenCalledWith('Pádel');
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'createSuccess' }));
    expect(result.current.nameDialog.mode).toBe('closed');
  });

  it('renames the group being edited', async () => {
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.openRename(group);
    });
    expect(result.current.nameInput).toBe('Amigos');

    act(() => {
      result.current.setNameInput('Amigos de la uni');
    });
    await act(async () => {
      await result.current.submitName();
    });

    expect(renameMutateAsyncMock).toHaveBeenCalledWith({ id: 'group-1', name: 'Amigos de la uni' });
  });

  it('keeps an empty name in the form without calling the API', async () => {
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.openCreate();
      result.current.setNameInput('   ');
    });
    await act(async () => {
      await result.current.submitName();
    });

    expect(createMutateAsyncMock).not.toHaveBeenCalled();
    expect(result.current.nameError).toBe('nameRequired');
    expect(result.current.nameDialog.mode).toBe('create');
  });

  it('shows a taken name in the form and keeps the dialog open', async () => {
    createMutateAsyncMock.mockRejectedValueOnce(new ApiError(409, 'Conflict', 'A group named Amigos already exists'));
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.openCreate();
      result.current.setNameInput('amigos');
    });
    await act(async () => {
      await result.current.submitName();
    });

    expect(result.current.nameError).toBe('nameTaken');
    expect(result.current.nameDialog.mode).toBe('create');
    expect(addToastMock).not.toHaveBeenCalled();
  });

  it('clears the form error as soon as the name is edited', async () => {
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.openCreate();
    });
    await act(async () => {
      await result.current.submitName();
    });
    expect(result.current.nameError).toBe('nameRequired');

    act(() => {
      result.current.setNameInput('P');
    });
    expect(result.current.nameError).toBeNull();
  });

  it('deletes the group once confirmed', async () => {
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.requestDelete(group);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteMutateAsyncMock).toHaveBeenCalledWith('group-1');
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(result.current.deletingGroup).toBeNull();
  });

  it('explains that a group with events cannot be deleted', async () => {
    deleteMutateAsyncMock.mockRejectedValueOnce(new ApiError(422, 'Unprocessable Entity', 'still has events'));
    const { result } = renderHook(() => useAdminGroupsPage());

    act(() => {
      result.current.requestDelete(group);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: 'deleteError', description: 'deleteHasEvents' }),
    );
  });
});
