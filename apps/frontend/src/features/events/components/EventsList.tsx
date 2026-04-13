import { useEvents } from '@/hooks/api/useEvents';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { EventsListSkeleton } from './EventsListSkeleton';
import { EventCard } from './EventCard';
import { CreateEventCard } from './CreateEventCard';
import { useNavigate } from 'react-router-dom';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { getEventIconComponent } from '../constants';
import { getParticipantAvatar, getParticipantName } from '../utils/participants';
import { ErrorState } from '@/shared/components/ErrorState';
import type { EventStatus } from '@/api/types';
import { cn } from '@/shared/utils/cn';

function EventIcon({ iconKey }: { iconKey?: string }) {
  const Comp = getEventIconComponent(iconKey);
  return Comp ? <Comp fontSize={32} /> : null;
}

interface EventsStatusToggleProps {
  value: EventStatus;
  onChange: (status: EventStatus) => void;
}

function EventsStatusToggle({ value, onChange }: EventsStatusToggleProps) {
  const { t } = useTranslation('events');

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
      <button
        type="button"
        onClick={() => onChange('active')}
        aria-pressed={value === 'active'}
        className={cn(
          'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
          value === 'active'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 dark:text-emerald-200 dark:hover:text-emerald-50',
        )}
      >
        {t('eventsList.toggleActive')}
      </button>
      <button
        type="button"
        onClick={() => onChange('archived')}
        aria-pressed={value === 'archived'}
        className={cn(
          'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
          value === 'archived'
            ? 'bg-slate-700 text-white shadow-sm dark:bg-emerald-700'
            : 'text-slate-600 hover:text-slate-900 dark:text-emerald-200 dark:hover:text-emerald-50',
        )}
      >
        {t('eventsList.toggleArchived')}
      </button>
    </div>
  );
}

/**
 * Events list component with consistent layout for all states.
 * Displays loading skeleton, error message, empty state, or list of events.
 */
export function EventsList() {
  const [statusFilter, setStatusFilter] = useState<EventStatus>('active');
  const { data: events, isLoading, error, refetch } = useEvents(statusFilter);
  const { t } = useTranslation('events');
  const navigate = useNavigate();
  const openModal = useEventFormModalStore((s) => s.openModal);
  const isArchivedView = statusFilter === 'archived';

  const onNewEvent = () => openModal();

  if (isLoading) {
    return <EventsListSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!events || events.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-4 sm:mt-8">
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border px-4 py-12',
            isArchivedView
              ? 'border-slate-300 bg-slate-50 dark:border-emerald-800 dark:bg-emerald-950/20'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
          )}
        >
          <p
            className={cn(
              'mb-2 text-lg font-medium',
              isArchivedView ? 'text-slate-600 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400',
            )}
          >
            {t(isArchivedView ? 'eventsList.noEventsArchived' : 'eventsList.noEventsActive')}
          </p>
          {!isArchivedView ? <CreateEventCard onClick={onNewEvent} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <EventsStatusToggle value={statusFilter} onChange={setStatusFilter} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {events.map((event, idx) => (
          <EventCard
            key={event.id}
            event={{
              id: event.id,
              title: event.title,
              description: event.description,
              status: event.status || 'active',
              participants:
                event.participants?.map((p) => ({
                  name: getParticipantName(p, t),
                  avatarUrl: getParticipantAvatar(p) ?? undefined,
                })) || [],
              lastModified: event.lastModified || event.updatedAt,
              icon: <EventIcon iconKey={event.icon} />,
            }}
            onClick={() => navigate(`/event/${event.id}`)}
            className="animate-in fade-in duration-500"
            style={{ animationDelay: `${idx * 75}ms`, animationFillMode: 'backwards' }}
          />
        ))}
        {!isArchivedView ? <CreateEventCard onClick={onNewEvent} /> : null}
      </div>
    </div>
  );
}
