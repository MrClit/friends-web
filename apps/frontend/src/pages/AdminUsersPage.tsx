import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdAdd } from 'react-icons/md';

import { AdminUsersDialogs, AdminUsersStats, AdminUsersTable, useAdminUsersPage } from '@/features/admin-users';
import { HeaderSection } from '@/shared/components/HeaderSection';

import { MainLayout } from './MainLayout';

export function AdminUsersPage() {
  const { t } = useTranslation();

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
        eyebrow={
          <Link
            to="/"
            className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-semibold text-emerald-700/90 transition-colors hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-emerald-300 dark:hover:text-emerald-100 dark:focus-visible:ring-offset-emerald-950"
          >
            <MdArrowBack size={18} aria-hidden />
            <span>{t('adminUsers.goHome')}</span>
          </Link>
        }
        title={t('adminUsers.title', 'User Management')}
        subtitle={t('adminUsers.subtitle', 'Manage users and roles')}
        onNewEvent={openCreateDialog}
        actionLabel={t('adminUsers.newUser', 'New User')}
        actionIcon={<MdAdd size={22} />}
      />

      <section className="space-y-6">
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
