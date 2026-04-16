import { useTranslation } from 'react-i18next';

import type { User } from '@/features/auth/types';
import { formatDateShort } from '@/shared/utils/format/formatDateShort';

import { AdminUserActions } from './AdminUserActions';
import { AdminUserIdentity } from './AdminUserIdentity';
import { AdminUserRoleBadge } from './AdminUserRoleBadge';

interface AdminUserMobileCardProps {
  user: User;
  disabled: boolean;
  editLabel: string;
  deleteLabel: string;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

function formatAdminUserDate(value?: string): string {
  if (!value) return '-';
  return formatDateShort(value) || '-';
}

export function AdminUserMobileCard({
  user,
  disabled,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: AdminUserMobileCardProps) {
  const { t } = useTranslation('adminUsers');

  return (
    <article className="rounded-md border border-slate-100 bg-white p-3 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/60">
      <div className="mb-3 flex items-start justify-between gap-3">
        <AdminUserIdentity user={user} showEmail />
        <AdminUserRoleBadge role={user.role} />
      </div>

      <dl className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-emerald-800/50 dark:bg-emerald-900/20">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-emerald-300/80">
            {t('fields.createdAt', 'Member since')}
          </dt>
          <dd className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-emerald-100">
            {formatAdminUserDate(user.createdAt)}
          </dd>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-emerald-800/50 dark:bg-emerald-900/20">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-emerald-300/80">
            {t('fields.updatedAt', 'Last updated')}
          </dt>
          <dd className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-emerald-100">
            {formatAdminUserDate(user.updatedAt)}
          </dd>
        </div>
      </dl>

      <AdminUserActions
        user={user}
        disabled={disabled}
        mobile
        editLabel={editLabel}
        deleteLabel={deleteLabel}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </article>
  );
}
