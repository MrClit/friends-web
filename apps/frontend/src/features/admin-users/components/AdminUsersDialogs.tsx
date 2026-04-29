import { useTranslation } from 'react-i18next';

import { DialogFormWrapper } from '@/shared/components/DialogFormWrapper';
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
        title={t('createTitle', { ns: 'adminUsers' })}
        closeAriaLabel={t('close', { ns: 'common' })}
        primaryAction={{
          label: isCreating
            ? t('creating', { ns: 'adminUsers' })
            : t('createAction', { ns: 'adminUsers' }),
          onClick: onCreateSubmit,
          disabled: isCreating,
        }}
        secondaryAction={{
          label: t('close', { ns: 'common' }),
          onClick: () => onCreateOpenChange(false),
          disabled: isCreating,
        }}
      >
        <AdminUserForm form={createForm} onChange={onCreateFormChange} mode="create" disabled={isCreating} />
      </DialogFormWrapper>

      <DialogFormWrapper
        open={isEditOpen}
        onOpenChange={onEditOpenChange}
        title={t('editTitle', { ns: 'adminUsers' })}
        closeAriaLabel={t('close', { ns: 'common' })}
        primaryAction={{
          label: isUpdating
            ? t('updating', { ns: 'adminUsers' })
            : t('updateAction', { ns: 'adminUsers' }),
          onClick: onEditSubmit,
          disabled: isUpdating,
        }}
        secondaryAction={{
          label: t('close', { ns: 'common' }),
          onClick: () => onEditOpenChange(false),
          disabled: isUpdating,
        }}
      >
        <AdminUserForm form={editForm} onChange={onEditFormChange} mode="edit" disabled={isUpdating} />
      </DialogFormWrapper>

      <ConfirmDialog
        open={isDeleteOpen}
        title={t('deleteTitle', { ns: 'adminUsers' })}
        message={t('deleteMessage', { ns: 'adminUsers' })}
        confirmText={
          isDeleting
            ? t('deleting', { ns: 'adminUsers' })
            : t('delete', { ns: 'common' })
        }
        cancelText={t('cancel', { ns: 'confirmDialog' })}
        onConfirm={onDeleteConfirm}
        onCancel={() => onDeleteOpenChange(false)}
      />
    </>
  );
}
