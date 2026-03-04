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
  const { t } = useTranslation();

  return (
    <>
      <DialogFormWrapper
        open={isCreateOpen}
        onOpenChange={onCreateOpenChange}
        title={t('adminUsers.createTitle', 'Create User')}
        closeAriaLabel={t('common.close')}
        primaryAction={{
          label: isCreating ? t('adminUsers.creating', 'Creating...') : t('adminUsers.createAction', 'Create user'),
          onClick: onCreateSubmit,
          disabled: isCreating,
        }}
        secondaryAction={{
          label: t('common.close', 'Close'),
          onClick: () => onCreateOpenChange(false),
          disabled: isCreating,
        }}
      >
        <AdminUserForm form={createForm} onChange={onCreateFormChange} mode="create" disabled={isCreating} />
      </DialogFormWrapper>

      <DialogFormWrapper
        open={isEditOpen}
        onOpenChange={onEditOpenChange}
        title={t('adminUsers.editTitle', 'Edit User')}
        closeAriaLabel={t('common.close')}
        primaryAction={{
          label: isUpdating ? t('adminUsers.updating', 'Updating...') : t('adminUsers.updateAction', 'Update user'),
          onClick: onEditSubmit,
          disabled: isUpdating,
        }}
        secondaryAction={{
          label: t('common.close', 'Close'),
          onClick: () => onEditOpenChange(false),
          disabled: isUpdating,
        }}
      >
        <AdminUserForm form={editForm} onChange={onEditFormChange} mode="edit" disabled={isUpdating} />
      </DialogFormWrapper>

      <ConfirmDialog
        open={isDeleteOpen}
        title={t('adminUsers.deleteTitle', 'Delete user?')}
        message={t(
          'adminUsers.deleteMessage',
          'This action will soft delete the user and cannot be undone from this screen.',
        )}
        confirmText={isDeleting ? t('adminUsers.deleting', 'Deleting...') : t('common.delete', 'Delete')}
        cancelText={t('confirmDialog.cancel', 'Cancel')}
        onConfirm={onDeleteConfirm}
        onCancel={() => onDeleteOpenChange(false)}
      />
    </>
  );
}
