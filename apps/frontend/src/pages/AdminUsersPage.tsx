import { useTranslation } from 'react-i18next';
import { MdPersonAdd } from 'react-icons/md';

import { AdminUsersDialogs, AdminUsersTable, useAdminUsersPage } from '@/features/admin-users';
import { HeaderSection } from '@/shared/components/HeaderSection';

import { MainLayout } from './MainLayout';

export function AdminUsersPage() {
  const { t } = useTranslation();

  // TODO: revisar todas esta pagina y sus componentes para mejorar la experiencia de usuario, especialmente en los estados de carga y error. Agregar skeletons, mensajes de error mas descriptivos, etc.

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
        title={t('adminUsers.title', 'User Management')}
        subtitle={t('adminUsers.subtitle', 'Manage users and roles')}
        onNewEvent={openCreateDialog}
        actionLabel={t('adminUsers.newUser', 'New User')}
        actionIcon={<MdPersonAdd size={22} />}
      />

      <section className="rounded-xl border border-emerald-200/70 bg-white/90 p-6 dark:border-emerald-800 dark:bg-emerald-900/30">
        {isLoadingUsers && <p className="text-slate-600 dark:text-emerald-200">{t('common.loading')}</p>}

        {Boolean(usersError) && (
          <p className="text-red-600 dark:text-red-300">
            {t('common.errorLoading', 'Could not load data. Please try again.')}
          </p>
        )}

        {!isLoadingUsers && !usersError && users.length === 0 && (
          <p className="text-slate-700 dark:text-emerald-100">
            {t('adminUsers.empty', 'No users found. Create your first user to start managing access.')}
          </p>
        )}

        {!isLoadingUsers && !usersError && users.length > 0 && (
          <>
            <p className="mb-4 text-slate-700 dark:text-emerald-100">
              {t('adminUsers.loadedUsers', '{{count}} users loaded', { count: users.length })}
            </p>
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
