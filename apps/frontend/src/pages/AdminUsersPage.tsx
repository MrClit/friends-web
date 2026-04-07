import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

import { AdminUsersDialogs, AdminUsersStats, AdminUsersTable, useAdminUsersPage } from '@/features/admin-users';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

import { MainLayout } from './MainLayout';

const ADMIN_USERS_NAMESPACES = ['adminUsers', 'common', 'confirmDialog'] as const;

export function AdminUsersPage() {
  const { t } = useTranslation(ADMIN_USERS_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(ADMIN_USERS_NAMESPACES);

  const {
    users,
    isLoadingUsers,
    usersError,
    isCreateOpen,
    createForm,
    isCreating,
    editingUserId,
    editForm,
    isUpdating,
    deletingUserId,
    isDeleting,
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
  } = useAdminUsersPage();

  const isMutating = isCreating || isUpdating || isDeleting;

  return (
    <MainLayout>
      <HeaderSection
        title={t('title', { ns: 'adminUsers', defaultValue: 'User Management' })}
        subtitle={t('subtitle', { ns: 'adminUsers', defaultValue: 'Manage users and roles' })}
        onNewEvent={openCreateDialog}
        actionLabel={t('newUser', { ns: 'adminUsers', defaultValue: 'New User' })}
        actionIcon={<MdAdd size={22} />}
      />

      <section className="space-y-6">
        {(isLoadingUsers || !isI18nReady) && (
          <p className="text-slate-600 dark:text-emerald-200">{t('loading', { ns: 'common' })}</p>
        )}

        {isI18nReady && Boolean(usersError) && (
          <p className="text-red-600 dark:text-red-300">
            {t('errorLoading', { ns: 'common', defaultValue: 'Could not load data. Please try again.' })}
          </p>
        )}

        {isI18nReady && !isLoadingUsers && !usersError && users.length === 0 && (
          <p className="text-slate-700 dark:text-emerald-100">
            {t('empty', {
              ns: 'adminUsers',
              defaultValue: 'No users found. Create your first user to start managing access.',
            })}
          </p>
        )}

        {isI18nReady && !isLoadingUsers && !usersError && users.length > 0 && (
          <>
            <AdminUsersStats users={users} />
            <AdminUsersTable users={users} disabled={isMutating} onEdit={startEdit} onDelete={requestDelete} />
          </>
        )}
      </section>

      <AdminUsersDialogs
        isCreateOpen={isCreateOpen}
        createForm={createForm}
        isCreating={isCreating}
        onCreateOpenChange={(open) => (open ? openCreateDialog() : closeCreateDialog())}
        onCreateFormChange={setCreateForm}
        onCreateSubmit={submitCreate}
        isEditOpen={!!editingUserId}
        editForm={editForm}
        isUpdating={isUpdating}
        onEditOpenChange={(open) => !open && cancelEdit()}
        onEditFormChange={setEditForm}
        onEditSubmit={submitEdit}
        isDeleteOpen={!!deletingUserId}
        isDeleting={isDeleting}
        onDeleteOpenChange={(open) => !open && cancelDelete()}
        onDeleteConfirm={confirmDelete}
      />
    </MainLayout>
  );
}
