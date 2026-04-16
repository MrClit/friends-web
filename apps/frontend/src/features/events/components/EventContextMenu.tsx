import { MdArchive, MdDelete, MdEdit, MdMoreVert, MdUnarchive } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui';
import type { EventStatus } from '@/api/types';
import { cn } from '@/shared/utils/cn';

interface EventContextMenuProps {
  status?: EventStatus;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleArchive?: () => void;
  disabled?: boolean;
}

export function EventContextMenu({
  status = 'active',
  onEdit,
  onDelete,
  onToggleArchive,
  disabled = false,
}: EventContextMenuProps) {
  const { t } = useTranslation('events');
  const isArchived = status === 'archived';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'cursor-pointer rounded-lg p-2 transition-colors',
            'hover:bg-emerald-200 dark:hover:bg-emerald-800',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label={t('eventContextMenu.options')}
        >
          <MdMoreVert className="text-emerald-900 dark:text-emerald-100 text-2xl" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white dark:bg-emerald-900">
        <DropdownMenuItem
          onClick={() => {
            if (onEdit) {
              onEdit();
            }
          }}
          className="hover:bg-emerald-100 dark:hover:bg-emerald-800 cursor-pointer"
        >
          <MdEdit className="mr-2 text-emerald-900 dark:text-emerald-100" />
          {t('eventContextMenu.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (onToggleArchive) {
              onToggleArchive();
            }
          }}
          className="hover:bg-slate-100 dark:hover:bg-emerald-800 cursor-pointer"
        >
          {isArchived ? (
            <MdUnarchive className="mr-2 text-slate-700 dark:text-emerald-100" />
          ) : (
            <MdArchive className="mr-2 text-slate-700 dark:text-emerald-100" />
          )}
          {t(isArchived ? 'eventContextMenu.unarchive' : 'eventContextMenu.archive')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (onDelete) {
              onDelete();
            }
          }}
          className="hover:bg-red-100 dark:hover:bg-red-900 cursor-pointer"
        >
          <MdDelete className="mr-2 text-red-700 dark:text-red-400" />
          {t('eventContextMenu.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
