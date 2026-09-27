import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link, useParams } from 'react-router';

import { AdminGroupMemberPicker, AdminGroupMembersList, useAdminGroupDetailPage } from '@/features/admin-groups';
import { useAdminUsers } from '@/hooks/api/useAdminUsers';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { HeaderSection } from '@/shared/components/HeaderSection';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

import { MainLayout } from './MainLayout';

const ADMIN_GROUPS_NAMESPACES = ['adminGroups', 'common', 'confirmDialog'] as const;

export function AdminGroupDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation(ADMIN_GROUPS_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(ADMIN_GROUPS_NAMESPACES);

  const {
    group,
    members,
    isLoading,
    isNotFound,
    loadError,
    isMutating,
    confirmingRemoval,
    addMember,
    requestRemove,
    cancelRemove,
    confirmRemove,
  } = useAdminGroupDetailPage(id);
  const { data: users = [] } = useAdminUsers();

  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);

  const backLink = (
    <Link
      to="/admin/groups"
      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-200"
    >
      <MdArrowBack aria-hidden />
      {t('detail.back', { ns: 'adminGroups' })}
    </Link>
  );

  const isReady = isI18nReady && !isNotFound && !isLoading && !loadError;

  return (
    <MainLayout>
      <HeaderSection
        eyebrow={backLink}
        title={group?.name ?? t('title', { ns: 'adminGroups' })}
        subtitle={group ? t('detail.subtitle', { ns: 'adminGroups' }) : undefined}
      />

      <section className="space-y-6">
        {isI18nReady && isNotFound && (
          <p className="text-slate-700 dark:text-emerald-100">{t('detail.notFound', { ns: 'adminGroups' })}</p>
        )}

        {!isNotFound && (isLoading || !isI18nReady) && (
          <p className="text-slate-600 dark:text-emerald-200">{t('loading', { ns: 'common' })}</p>
        )}

        {isI18nReady && !isNotFound && Boolean(loadError) && (
          <p className="text-red-600 dark:text-red-300">{t('errorLoading', { ns: 'common' })}</p>
        )}

        {isReady && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-emerald-300/80">
                {t('memberCount', { ns: 'adminGroups', count: members.length })}
              </p>
              <AdminGroupMemberPicker
                users={users}
                memberIds={memberIds}
                disabled={isMutating}
                onAdd={(userId) => void addMember(userId)}
              />
            </div>

            {members.length === 0 ? (
              <p className="text-slate-700 dark:text-emerald-100">{t('detail.empty', { ns: 'adminGroups' })}</p>
            ) : (
              <AdminGroupMembersList
                members={members}
                disabled={isMutating}
                onRemove={(member) => void requestRemove(member)}
              />
            )}
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmingRemoval}
        title={t('detail.removeLastTitle', {
          ns: 'adminGroups',
          name: confirmingRemoval?.name || confirmingRemoval?.email || '',
        })}
        message={t('detail.removeLastMessage', { ns: 'adminGroups' })}
        confirmText={t('detail.removeLastConfirm', { ns: 'adminGroups' })}
        cancelText={t('cancel', { ns: 'confirmDialog' })}
        onConfirm={() => void confirmRemove()}
        onCancel={cancelRemove}
      />
    </MainLayout>
  );
}
