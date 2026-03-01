import type { User } from '@/features/auth/types';

interface AdminUserActionsProps {
  user: User;
  disabled: boolean;
  mobile?: boolean;
  editLabel: string;
  deleteLabel: string;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function AdminUserActions({
  user,
  disabled,
  mobile = false,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: AdminUserActionsProps) {
  if (mobile) {
    return (
      <div className="grid grid-cols-2 gap-2">
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
