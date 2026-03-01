import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
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
      <Dialog open={isCreateOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.createTitle', 'Create User')}</DialogTitle>
            <DialogCloseButton onClick={() => onCreateOpenChange(false)} disabled={isCreating} aria-label={t('common.close')} />
          </DialogHeader>

          <div className="px-8 py-6">
            <AdminUserForm form={createForm} onChange={onCreateFormChange} mode="create" disabled={isCreating} />
          </div>

          <DialogFooter className="px-8 pb-8">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => onCreateOpenChange(false)}
              disabled={isCreating}
            >
              {t('common.close', 'Close')}
            </button>
            <button
              type="button"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              onClick={onCreateSubmit}
              disabled={isCreating}
            >
              {isCreating ? t('adminUsers.creating', 'Creating...') : t('adminUsers.createAction', 'Create user')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.editTitle', 'Edit User')}</DialogTitle>
            <DialogCloseButton onClick={() => onEditOpenChange(false)} disabled={isUpdating} aria-label={t('common.close')} />
          </DialogHeader>

          <div className="px-8 py-6">
            <AdminUserForm form={editForm} onChange={onEditFormChange} mode="edit" disabled={isUpdating} />
          </div>

          <DialogFooter className="px-8 pb-8">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => onEditOpenChange(false)}
              disabled={isUpdating}
            >
              {t('common.close', 'Close')}
            </button>
            <button
              type="button"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              onClick={onEditSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? t('adminUsers.updating', 'Updating...') : t('adminUsers.updateAction', 'Update user')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        title={t('adminUsers.deleteTitle', 'Delete user?')}
        message={t('adminUsers.deleteMessage', 'This action will soft delete the user and cannot be undone from this screen.')}
        confirmText={isDeleting ? t('adminUsers.deleting', 'Deleting...') : t('common.delete', 'Delete')}
        cancelText={t('confirmDialog.cancel', 'Cancel')}
        onConfirm={onDeleteConfirm}
        onCancel={() => onDeleteOpenChange(false)}
      />
    </>
  );
}
