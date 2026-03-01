import type { User } from '@/features/auth/types';

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

export function AdminUserMobileCard({
  user,
  disabled,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: AdminUserMobileCardProps) {
  return (
    <article className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <AdminUserIdentity user={user} showEmail />
        <AdminUserRoleBadge role={user.role} />
      </div>

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
