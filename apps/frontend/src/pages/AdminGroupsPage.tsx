import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

import { AdminGroupNameDialog, AdminGroupsTable, useAdminGroupsPage } from '@/features/admin-groups';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

import { MainLayout } from './MainLayout';

const ADMIN_GROUPS_NAMESPACES = ['adminGroups', 'common', 'confirmDialog'] as const;

export function AdminGroupsPage() {
  const { t } = useTranslation(ADMIN_GROUPS_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(ADMIN_GROUPS_NAMESPACES);

  const {
    groups,
    isLoadingGroups,
    groupsError,
    nameDialog,
    nameInput,
    nameError,
    isSavingName,
    deletingGroup,
    isDeleting,
    openCreate,
    openRename,
    closeNameDialog,
    setNameInput,
    submitName,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useAdminGroupsPage();

  const isLoaded = isI18nReady && !isLoadingGroups && !groupsError;

  return (
    <MainLayout>
      <HeaderSection
        title={t('title', { ns: 'adminGroups' })}
        subtitle={t('subtitle', { ns: 'adminGroups' })}
        onNewEvent={openCreate}
        actionLabel={t('newGroup', { ns: 'adminGroups' })}
        actionIcon={<MdAdd size={22} />}
      />

      <section className="space-y-6">
        {(isLoadingGroups || !isI18nReady) && (
          <p className="text-slate-600 dark:text-emerald-200">{t('loading', { ns: 'common' })}</p>
        )}

        {isI18nReady && Boolean(groupsError) && (
          <p className="text-red-600 dark:text-red-300">{t('errorLoading', { ns: 'common' })}</p>
        )}

        {isLoaded && groups.length === 0 && (
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-emerald-100">{t('empty', { ns: 'adminGroups' })}</p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              <MdAdd size={18} aria-hidden />
              {t('newGroup', { ns: 'adminGroups' })}
            </button>
          </div>
        )}

        {isLoaded && groups.length > 0 && (
          <AdminGroupsTable
            groups={groups}
            disabled={isSavingName || isDeleting}
            onRename={openRename}
            onDelete={requestDelete}
          />
        )}
      </section>

      <AdminGroupNameDialog
        mode={nameDialog.mode}
        name={nameInput}
        error={nameError}
        isSaving={isSavingName}
        onNameChange={setNameInput}
        onClose={closeNameDialog}
        onSubmit={submitName}
      />

      <ConfirmDialog
        open={!!deletingGroup}
        title={t('deleteTitle', { ns: 'adminGroups' })}
        message={t('deleteMessage', { ns: 'adminGroups', name: deletingGroup?.name ?? '' })}
        confirmText={isDeleting ? t('deleting', { ns: 'adminGroups' }) : t('delete', { ns: 'common' })}
        cancelText={t('cancel', { ns: 'confirmDialog' })}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </MainLayout>
  );
}
