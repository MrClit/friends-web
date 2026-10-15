import type { User } from '@/features/auth/types';

interface AdminUserActionsProps {
  user: User;
  disabled: boolean;
  mobile?: boolean;
  inviteLabel: string;
  editLabel: string;
  deleteLabel: string;
  onInvite: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function AdminUserActions({
  user,
  disabled,
  mobile = false,
  inviteLabel,
  editLabel,
  deleteLabel,
  onInvite,
  onEdit,
  onDelete,
}: AdminUserActionsProps) {
  // Inviting only shares text and never touches the server, so it stays available while a
  // mutation is in flight — unlike edit and delete.
  if (mobile) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="rounded-md border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
          onClick={() => onInvite(user)}
        >
          {inviteLabel}
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => onEdit(user)}
          disabled={disabled}
        >
          {editLabel}
        </button>
        <button
          type="button"
          className="rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
          onClick={() => onDelete(user.id)}
          disabled={disabled}
        >
          {deleteLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex gap-2">
      <button
        type="button"
        className="rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
        onClick={() => onInvite(user)}
      >
        {inviteLabel}
      </button>
      <button
        type="button"
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        onClick={() => onEdit(user)}
        disabled={disabled}
      >
        {editLabel}
      </button>
      <button
        type="button"
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
        onClick={() => onDelete(user.id)}
        disabled={disabled}
      >
        {deleteLabel}
      </button>
    </div>
  );
}
