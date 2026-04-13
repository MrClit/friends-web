import { MdArrowBack } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { EventStatus } from '@/api/types';
import { EventContextMenu } from './EventContextMenu';

interface EventDetailHeaderProps {
  eventTitle: string;
  eventStatus: EventStatus;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleArchive?: () => void;
  isMutatingStatus?: boolean;
}

export function EventDetailHeader({
  eventTitle,
  eventStatus,
  onBack,
  onEdit,
  onDelete,
  onToggleArchive,
  isMutatingStatus = false,
}: EventDetailHeaderProps) {
  const { t } = useTranslation(['common', 'events']);
  const isArchived = eventStatus === 'archived';
  const hasActions = Boolean(onEdit || onDelete || onToggleArchive);

  return (
    <section
      className={cn(
        'mb-6 rounded-2xl border p-4 sm:p-5',
        isArchived
          ? 'border-slate-200 bg-slate-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/25'
          : 'border-transparent bg-transparent p-0',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('back')}
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
          <div className="overflow-hidden">
            <h1
              className={cn(
                'truncate text-xl font-bold tracking-tight sm:text-3xl',
                isArchived ? 'text-slate-700 dark:text-emerald-100/85' : 'text-slate-900 dark:text-white',
              )}
            >
              {eventTitle}
            </h1>
            {isArchived ? (
              <span className="mt-2 inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                {t('status.archived', { ns: 'events' })}
              </span>
            ) : null}
          </div>
        </div>
        {hasActions ? (
          <div className="shrink-0">
            <EventContextMenu
              status={eventStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleArchive={onToggleArchive}
              disabled={isMutatingStatus}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
