import { MdArrowBack, MdEdit, MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

interface EventDetailHeaderProps {
  eventId: string;
  eventTitle: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventDetailHeader({ eventTitle, onBack, onEdit, onDelete }: EventDetailHeaderProps) {
  const { t } = useTranslation();
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            className={cn(
              'bg-white dark:bg-emerald-950',
              'p-2 rounded-xl shadow-sm',
              'border border-slate-100 dark:border-slate-700',
              'hover:bg-slate-50 dark:hover:bg-slate-700',
              'transition group shrink-0',
            )}
          >
            <MdArrowBack className={cn('text-slate-500 dark:text-slate-400', 'group-hover:text-emerald-500')} />
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {eventTitle}
          </h1>
        </div>
        {hasActions ? (
          <div className="flex items-center gap-2 shrink-0">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                aria-label={t('common.edit')}
                className={cn(
                  'flex items-center justify-center gap-2',
                  'p-2 sm:px-4 sm:py-2',
                  'bg-white dark:bg-emerald-950',
                  'border border-slate-200 dark:border-slate-700',
                  'rounded-lg',
                  'text-slate-600 dark:text-slate-300',
                  'hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400',
                  'transition shadow-sm text-sm font-medium',
                )}
              >
                <MdEdit size={20} />
                <span className="hidden sm:inline">Editar</span>
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t('common.delete')}
                className={cn(
                  'flex items-center justify-center gap-2',
                  'p-2 sm:px-4 sm:py-2',
                  'bg-white dark:bg-emerald-950',
                  'border border-slate-200 dark:border-slate-700',
                  'rounded-lg',
                  'text-red-500',
                  'hover:bg-red-50 dark:hover:bg-red-900/50 hover:border-red-200',
                  'transition shadow-sm text-sm font-medium',
                )}
              >
                <MdDelete size={20} />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
