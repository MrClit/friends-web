import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { User } from '@/features/auth/types';
import { useAdminUsers, useCreateAdminUser, useDeleteAdminUser, useUpdateAdminUser } from '@/hooks/api/useAdminUsers';
import { useToastStore } from '@/shared/store/useToastStore';

import {
  EMPTY_CREATE_ADMIN_USER_FORM,
  EMPTY_EDIT_ADMIN_USER_FORM,
  type CreateAdminUserFormData,
  type EditAdminUserFormData,
} from '../types';
import { getAdminUsersErrorMessage } from '../utils/errorMessage';

interface UseAdminUsersPageResult {
  users: User[];
  isLoadingUsers: boolean;
  usersError: unknown;
  isCreateOpen: boolean;
  createForm: CreateAdminUserFormData;
  isCreating: boolean;
  editingUserId: string | null;
  editForm: EditAdminUserFormData;
  isUpdating: boolean;
  deletingUserId: string | null;
  isDeleting: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  setCreateForm: (form: CreateAdminUserFormData) => void;
  submitCreate: () => Promise<void>;
  startEdit: (user: User) => void;
  cancelEdit: () => void;
  setEditForm: (form: EditAdminUserFormData) => void;
  submitEdit: () => Promise<void>;
  requestDelete: (userId: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export function useAdminUsersPage(): UseAdminUsersPageResult {
  const { t } = useTranslation(['adminUsers', 'common']);
  const addToast = useToastStore((state) => state.addToast);

  const { data: users = [], isPending: isLoadingUsers, error: usersError } = useAdminUsers();
  const createUserMutation = useCreateAdminUser();
  const updateUserMutation = useUpdateAdminUser();
  const deleteUserMutation = useDeleteAdminUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserFormData>(EMPTY_CREATE_ADMIN_USER_FORM);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditAdminUserFormData>(EMPTY_EDIT_ADMIN_USER_FORM);

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const openCreateDialog = () => setIsCreateOpen(true);
  const closeCreateDialog = () => {
    setIsCreateOpen(false);
    setCreateForm(EMPTY_CREATE_ADMIN_USER_FORM);
  };

  const submitCreate = async () => {
    if (!createForm.email.trim()) {
      addToast({
        type: 'error',
        message: t('validation_error', { ns: 'common' }),
        duration: 5000,
      });
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email: createForm.email.trim(),
        role: createForm.role,
      });
      addToast({
        type: 'success',
        message: t('createSuccess', { ns: 'adminUsers' }),
        duration: 3500,
      });
      closeCreateDialog();
    } catch (error) {
      addToast({
        type: 'error',
        message: t('createError', { ns: 'adminUsers' }),
        description: getAdminUsersErrorMessage(
          error,
          t('createError', { ns: 'adminUsers' }),
        ),
        duration: 6000,
      });
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      email: user.email,
      name: user.name ?? '',
      avatar: user.avatar ?? '',
      role: user.role,
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm(EMPTY_EDIT_ADMIN_USER_FORM);
  };

  const submitEdit = async () => {
    if (!editingUserId) {
      return;
    }

    if (!editForm.email.trim()) {
      addToast({
        type: 'error',
        message: t('validation_error', { ns: 'common' }),
        duration: 5000,
      });
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: editingUserId,
        data: {
          email: editForm.email.trim(),
          name: editForm.name.trim() || undefined,
          avatar: editForm.avatar.trim() || undefined,
          role: editForm.role,
        },
      });
      addToast({
        type: 'success',
        message: t('updateSuccess', { ns: 'adminUsers' }),
        duration: 3500,
      });
      cancelEdit();
    } catch (error) {
      addToast({
        type: 'error',
        message: t('updateError', { ns: 'adminUsers' }),
        description: getAdminUsersErrorMessage(
          error,
          t('updateError', { ns: 'adminUsers' }),
        ),
        duration: 6000,
      });
    }
  };

  const requestDelete = (userId: string) => setDeletingUserId(userId);
  const cancelDelete = () => setDeletingUserId(null);

  const confirmDelete = async () => {
    if (!deletingUserId) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(deletingUserId);
      addToast({
        type: 'success',
        message: t('deleteSuccess', { ns: 'adminUsers' }),
        duration: 3500,
      });
      cancelDelete();
    } catch (error) {
      addToast({
        type: 'error',
        message: t('deleteError', { ns: 'adminUsers' }),
        description: getAdminUsersErrorMessage(
          error,
          t('deleteError', { ns: 'adminUsers' }),
        ),
        duration: 6000,
      });
    }
  };

  return {
    users,
    isLoadingUsers,
    usersError,
    isCreateOpen,
    createForm,
    isCreating: createUserMutation.isPending,
    editingUserId,
    editForm,
    isUpdating: updateUserMutation.isPending,
    deletingUserId,
    isDeleting: deleteUserMutation.isPending,
    openCreateDialog,
    closeCreateDialog,
    setCreateForm,
    submitCreate,
    startEdit,
    cancelEdit,
    setEditForm,
    submitEdit,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
