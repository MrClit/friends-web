import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminUsersPage } from './useAdminUsersPage';
import { useAdminUsers, useCreateAdminUser, useDeleteAdminUser, useUpdateAdminUser } from '@/hooks/api/useAdminUsers';

const addToastMock = vi.fn();
const createMutateAsyncMock = vi.fn();
const updateMutateAsyncMock = vi.fn();
const deleteMutateAsyncMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/hooks/api/useAdminUsers', () => ({
  useAdminUsers: vi.fn(),
  useCreateAdminUser: vi.fn(),
  useUpdateAdminUser: vi.fn(),
  useDeleteAdminUser: vi.fn(),
}));

vi.mock('@/shared/store/useToastStore', () => ({
  useToastStore: (selector: (state: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

const CREATED_USER = { id: 'created-1', email: 'new@test.com', role: 'admin' };

describe('useAdminUsersPage', () => {
  const mockedUseAdminUsers = vi.mocked(useAdminUsers);
  const mockedUseCreateAdminUser = vi.mocked(useCreateAdminUser);
  const mockedUseUpdateAdminUser = vi.mocked(useUpdateAdminUser);
  const mockedUseDeleteAdminUser = vi.mocked(useDeleteAdminUser);

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseAdminUsers.mockReturnValue({
      data: [
        {
          id: 'user-1',
          email: 'user1@test.com',
          name: 'User One',
          avatar: '',
          role: 'user',
        },
      ],
      isPending: false,
      error: null,
    } as never);

    mockedUseCreateAdminUser.mockReturnValue({
      mutateAsync: createMutateAsyncMock.mockResolvedValue(CREATED_USER),
      isPending: false,
    } as never);

    mockedUseUpdateAdminUser.mockReturnValue({
      mutateAsync: updateMutateAsyncMock.mockResolvedValue({ id: 'updated-1' }),
      isPending: false,
    } as never);

    mockedUseDeleteAdminUser.mockReturnValue({
      mutateAsync: deleteMutateAsyncMock.mockResolvedValue({ success: true }),
      isPending: false,
    } as never);
  });

  it('submits create mutation with normalized payload', async () => {
    const { result } = renderHook(() => useAdminUsersPage());

    act(() => {
      result.current.setCreateForm({ email: '  new@test.com  ', role: 'admin' });
    });

    await act(async () => {
      await result.current.submitCreate();
    });

    expect(createMutateAsyncMock).toHaveBeenCalledWith({
      email: 'new@test.com',
      role: 'admin',
    });
  });

  it('keeps the dialog open on the "user created" step after a successful create', async () => {
    const { result } = renderHook(() => useAdminUsersPage());

    act(() => {
      result.current.openCreateDialog();
      result.current.setCreateForm({ email: 'new@test.com', role: 'admin' });
    });

    await act(async () => {
      await result.current.submitCreate();
    });

    expect(result.current.isCreateOpen).toBe(true);
    expect(result.current.createdUser).toEqual(CREATED_USER);
    // The step itself says the user was created, so no success toast on top of it.
    expect(addToastMock).not.toHaveBeenCalled();

    act(() => {
      result.current.closeCreateDialog();
    });

    expect(result.current.isCreateOpen).toBe(false);
    expect(result.current.createdUser).toBeNull();
    expect(result.current.createForm.email).toBe('');
  });

  it('stays on the form and reports the error when the create fails', async () => {
    createMutateAsyncMock.mockRejectedValueOnce(new Error('conflict'));
    const { result } = renderHook(() => useAdminUsersPage());

    act(() => {
      result.current.openCreateDialog();
      result.current.setCreateForm({ email: 'taken@test.com', role: 'user' });
    });

    await act(async () => {
      await result.current.submitCreate();
    });

    expect(result.current.isCreateOpen).toBe(true);
    expect(result.current.createdUser).toBeNull();
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('submits update mutation with normalized payload', async () => {
    const { result } = renderHook(() => useAdminUsersPage());

    act(() => {
      result.current.startEdit({
        id: 'user-1',
        email: 'user1@test.com',
        name: 'User One',
        avatar: '',
        role: 'user',
      });
      result.current.setEditForm({
        email: '  user1-updated@test.com  ',
        name: '  ',
        avatar: '  ',
        role: 'admin',
      });
    });

    await act(async () => {
      await result.current.submitEdit();
    });

    expect(updateMutateAsyncMock).toHaveBeenCalledWith({
      id: 'user-1',
      data: {
        email: 'user1-updated@test.com',
        name: undefined,
        avatar: undefined,
        role: 'admin',
      },
    });
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('submits delete mutation when delete is confirmed', async () => {
    const { result } = renderHook(() => useAdminUsersPage());

    act(() => {
      result.current.requestDelete('user-1');
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteMutateAsyncMock).toHaveBeenCalledWith('user-1');
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });
});
