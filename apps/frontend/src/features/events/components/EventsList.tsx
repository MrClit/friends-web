import { useEvents } from '@/hooks/api/useEvents';
import { useTranslation } from 'react-i18next';
import EventsListSkeleton from './EventsListSkeleton';
import { EventCard } from './EventCard';
import { CreateEventCard } from './CreateEventCard';
import { useNavigate } from 'react-router-dom';

/**
 * Events list component with consistent layout for all states.
 * Displays loading skeleton, error message, empty state, or list of events.
 */
export default function EventsList() {
  const { data: events, isLoading, error } = useEvents();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <EventsListSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-4 sm:mt-8">
        <div className="text-center py-8 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">{t('common.errorLoading')}</p>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-4 sm:mt-8">
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-emerald-600 dark:text-emerald-400 text-lg font-medium mb-2">{t('eventsList.noEvents')}</p>
          <CreateEventCard onClick={() => navigate('/event/new')} />
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
              // description: 'Event description',
              // status: 'active',
              participants:
                event.participants?.map((p) => ({
                  name: p.name,
                  avatarUrl: '',
                })) || [],
              lastModified: event.updatedAt ? t('event.card.lastModified', { date: event.updatedAt }) : undefined,
              // icon: ... // Opcional: lógica para icono según tipo de evento
            }}
            onClick={() => navigate(`/event/${event.id}`)}
            className="animate-in fade-in duration-500"
            style={{ animationDelay: `${idx * 75}ms`, animationFillMode: 'backwards' }}
          />
        ))}
        <CreateEventCard onClick={() => navigate('/event/new')} />
      </div>
    </div>
  );
}
