import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/client';
import type { AdminGroup } from '@/api/admin-groups.api';
import {
  useAdminGroups,
  useCreateAdminGroup,
  useDeleteAdminGroup,
  useRenameAdminGroup,
} from '@/hooks/api/useAdminGroups';
import { useToastStore } from '@/shared/store/useToastStore';
import { getApiErrorMessage } from '@/shared/utils';

/** Which group the name dialog is editing: none (closed), a new one, or an existing one. */
type NameDialogState = { mode: 'closed' } | { mode: 'create' } | { mode: 'rename'; group: AdminGroup };

interface UseAdminGroupsPageResult {
  groups: AdminGroup[];
  isLoadingGroups: boolean;
  groupsError: unknown;
  nameDialog: NameDialogState;
  nameInput: string;
  nameError: string | null;
  isSavingName: boolean;
  deletingGroup: AdminGroup | null;
  isDeleting: boolean;
  openCreate: () => void;
  openRename: (group: AdminGroup) => void;
  closeNameDialog: () => void;
  setNameInput: (name: string) => void;
  submitName: () => Promise<void>;
  requestDelete: (group: AdminGroup) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export function useAdminGroupsPage(): UseAdminGroupsPageResult {
  const { t } = useTranslation(['adminGroups', 'common']);
  const addToast = useToastStore((state) => state.addToast);

  const { data: groups = [], isPending: isLoadingGroups, error: groupsError } = useAdminGroups();
  const createGroupMutation = useCreateAdminGroup();
  const renameGroupMutation = useRenameAdminGroup();
  const deleteGroupMutation = useDeleteAdminGroup();

  const [nameDialog, setNameDialog] = useState<NameDialogState>({ mode: 'closed' });
  const [nameInput, setNameInputState] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<AdminGroup | null>(null);

  const openCreate = () => {
    setNameDialog({ mode: 'create' });
    setNameInputState('');
    setNameError(null);
  };

  const openRename = (group: AdminGroup) => {
    setNameDialog({ mode: 'rename', group });
    setNameInputState(group.name);
    setNameError(null);
  };

  const closeNameDialog = () => {
    setNameDialog({ mode: 'closed' });
    setNameInputState('');
    setNameError(null);
  };

  const setNameInput = (name: string) => {
    setNameInputState(name);
    setNameError(null);
  };

  const submitName = async () => {
    if (nameDialog.mode === 'closed') {
      return;
    }

    const name = nameInput.trim();
    if (!name) {
      setNameError(t('nameRequired', { ns: 'adminGroups' }));
      return;
    }

    const isCreate = nameDialog.mode === 'create';

    try {
      if (isCreate) {
        await createGroupMutation.mutateAsync(name);
      } else {
        await renameGroupMutation.mutateAsync({ id: nameDialog.group.id, name });
      }
      addToast({
        type: 'success',
        message: t(isCreate ? 'createSuccess' : 'renameSuccess', { ns: 'adminGroups' }),
        duration: 3500,
      });
      closeNameDialog();
    } catch (error) {
      // A taken or invalid name is something the admin fixes in the form, so it stays there.
      if (error instanceof ApiError && error.status === 409) {
        setNameError(t('nameTaken', { ns: 'adminGroups' }));
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        setNameError(t('validation_error', { ns: 'common' }));
        return;
      }
      addToast({
        type: 'error',
        message: t(isCreate ? 'createError' : 'renameError', { ns: 'adminGroups' }),
        description: getApiErrorMessage(error, t),
        duration: 6000,
      });
    }
  };

  const requestDelete = (group: AdminGroup) => setDeletingGroup(group);
  const cancelDelete = () => setDeletingGroup(null);

  const confirmDelete = async () => {
    if (!deletingGroup) {
      return;
    }

    try {
      await deleteGroupMutation.mutateAsync(deletingGroup.id);
      addToast({
        type: 'success',
        message: t('deleteSuccess', { ns: 'adminGroups' }),
        duration: 3500,
      });
      cancelDelete();
    } catch (error) {
      // The backend refuses a group that still has events with a 422; the generic 422 text would not say why.
      const hasEvents = error instanceof ApiError && error.status === 422;
      addToast({
        type: 'error',
        message: t('deleteError', { ns: 'adminGroups' }),
        description: hasEvents ? t('deleteHasEvents', { ns: 'adminGroups' }) : getApiErrorMessage(error, t),
        duration: 6000,
      });
      cancelDelete();
    }
  };

  return {
    groups,
    isLoadingGroups,
    groupsError,
    nameDialog,
    nameInput,
    nameError,
    isSavingName: createGroupMutation.isPending || renameGroupMutation.isPending,
    deletingGroup,
    isDeleting: deleteGroupMutation.isPending,
    openCreate,
    openRename,
    closeNameDialog,
    setNameInput,
    submitName,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
