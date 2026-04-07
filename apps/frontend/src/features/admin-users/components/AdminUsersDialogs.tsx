import { useTranslation } from 'react-i18next';

import DialogFormWrapper from '@/shared/components/DialogFormWrapper';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

import { AdminUserForm } from './AdminUserForm';
import type { CreateAdminUserFormData, EditAdminUserFormData } from '../types';

interface AdminUsersDialogsProps {
  isCreateOpen: boolean;
  createForm: CreateAdminUserFormData;
  isCreating: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onCreateFormChange: (form: CreateAdminUserFormData) => void;
  onCreateSubmit: () => Promise<void>;
  isEditOpen: boolean;
  editForm: EditAdminUserFormData;
  isUpdating: boolean;
  onEditOpenChange: (open: boolean) => void;
  onEditFormChange: (form: EditAdminUserFormData) => void;
  onEditSubmit: () => Promise<void>;
  isDeleteOpen: boolean;
  isDeleting: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => Promise<void>;
}

export function AdminUsersDialogs({
  isCreateOpen,
  createForm,
  isCreating,
  onCreateOpenChange,
  onCreateFormChange,
  onCreateSubmit,
  isEditOpen,
  editForm,
  isUpdating,
  onEditOpenChange,
  onEditFormChange,
  onEditSubmit,
  isDeleteOpen,
  isDeleting,
  onDeleteOpenChange,
  onDeleteConfirm,
}: AdminUsersDialogsProps) {
  const { t } = useTranslation(['adminUsers', 'common', 'confirmDialog']);

  return (
    <>
      <DialogFormWrapper
        open={isCreateOpen}
        onOpenChange={onCreateOpenChange}
        title={t('createTitle', { ns: 'adminUsers', defaultValue: 'Create User' })}
        closeAriaLabel={t('close', { ns: 'common' })}
        primaryAction={{
          label: isCreating
            ? t('creating', { ns: 'adminUsers', defaultValue: 'Creating...' })
            : t('createAction', { ns: 'adminUsers', defaultValue: 'Create user' }),
          onClick: onCreateSubmit,
          disabled: isCreating,
        }}
        secondaryAction={{
          label: t('close', { ns: 'common', defaultValue: 'Close' }),
          onClick: () => onCreateOpenChange(false),
          disabled: isCreating,
        }}
      >
        <AdminUserForm form={createForm} onChange={onCreateFormChange} mode="create" disabled={isCreating} />
      </DialogFormWrapper>

      <DialogFormWrapper
        open={isEditOpen}
        onOpenChange={onEditOpenChange}
        title={t('editTitle', { ns: 'adminUsers', defaultValue: 'Edit User' })}
        closeAriaLabel={t('close', { ns: 'common' })}
        primaryAction={{
          label: isUpdating
            ? t('updating', { ns: 'adminUsers', defaultValue: 'Updating...' })
            : t('updateAction', { ns: 'adminUsers', defaultValue: 'Update user' }),
          onClick: onEditSubmit,
          disabled: isUpdating,
        }}
        secondaryAction={{
          label: t('close', { ns: 'common', defaultValue: 'Close' }),
          onClick: () => onEditOpenChange(false),
          disabled: isUpdating,
        }}
      >
        <AdminUserForm form={editForm} onChange={onEditFormChange} mode="edit" disabled={isUpdating} />
      </DialogFormWrapper>

      <ConfirmDialog
        open={isDeleteOpen}
        title={t('deleteTitle', { ns: 'adminUsers', defaultValue: 'Delete user?' })}
        message={t('deleteMessage', {
          ns: 'adminUsers',
          defaultValue: 'This action will soft delete the user and cannot be undone from this screen.',
        })}
        confirmText={
          isDeleting
            ? t('deleting', { ns: 'adminUsers', defaultValue: 'Deleting...' })
            : t('delete', { ns: 'common', defaultValue: 'Delete' })
        }
        cancelText={t('cancel', { ns: 'confirmDialog', defaultValue: 'Cancel' })}
        onConfirm={onDeleteConfirm}
        onCancel={() => onDeleteOpenChange(false)}
      />
    </>
  );
}
