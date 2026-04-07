import { useEvents } from '@/hooks/api/useEvents';
import { useTranslation } from 'react-i18next';
import { EventsListSkeleton } from './EventsListSkeleton';
import { EventCard } from './EventCard';
import { CreateEventCard } from './CreateEventCard';
import { useNavigate } from 'react-router-dom';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { getEventIconComponent } from '../constants';
import { getParticipantAvatar, getParticipantName } from '../utils/participants';
import { ErrorState } from '@/shared/components/ErrorState';

function EventIcon({ iconKey }: { iconKey?: string }) {
  const Comp = getEventIconComponent(iconKey);
  return Comp ? <Comp fontSize={32} /> : null;
}

/**
 * Events list component with consistent layout for all states.
 * Displays loading skeleton, error message, empty state, or list of events.
 */
export function EventsList() {
  const { data: events, isLoading, error, refetch } = useEvents();
  const { t } = useTranslation('events');
  const navigate = useNavigate();
  const openModal = useEventFormModalStore((s) => s.openModal);

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
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-emerald-600 dark:text-emerald-400 text-lg font-medium mb-2">{t('eventsList.noEvents')}</p>
          <CreateEventCard onClick={onNewEvent} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
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
        <CreateEventCard onClick={onNewEvent} />
      </div>
    </div>
  );
}
