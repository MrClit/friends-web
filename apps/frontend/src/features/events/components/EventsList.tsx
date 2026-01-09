import { useEvents } from '@/hooks/api/useEvents';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdEventNote } from 'react-icons/md';
import EventsListSkeleton from './EventsListSkeleton';

/**
 * Events list component with consistent layout for all states.
 * Displays loading skeleton, error message, empty state, or list of events.
 */
export default function EventsList() {
  const { data: events, isLoading, error } = useEvents();
  const { t } = useTranslation();

  if (isLoading) {
    return <EventsListSkeleton />;
  }

  // Error state with consistent wrapper
  if (error) {
    return (
      <div className="w-full max-w-2xl mt-4 sm:mt-8">
        <div className="text-center py-8 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">{t('common.errorLoading')}</p>
        </div>
      </div>
    );
  }

  // Empty state with consistent wrapper
  if (!events || events.length === 0) {
    return (
      <div className="w-full max-w-2xl mt-4 sm:mt-8">
        <h2 className="text-xl font-semibold mb-4 text-teal-700 dark:text-teal-200">{t('eventsList.title')}</h2>
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
          <MdEventNote className="text-6xl text-teal-300 dark:text-teal-600 mb-4" />
          <p className="text-teal-600 dark:text-teal-400 text-lg font-medium mb-2">{t('eventsList.noEvents')}</p>
          <p className="text-teal-500 dark:text-teal-500 text-sm">{t('eventsList.emptyHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mt-4 sm:mt-8">
      <h2 className="text-xl font-semibold mb-4 text-teal-700 dark:text-teal-200">{t('eventsList.title')}</h2>
      <ul className="space-y-3" aria-label={t('eventsList.title')}>
        {events.map((event, index) => (
          <li
            key={event.id}
            className="animate-in fade-in duration-500"
            style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
          >
            <Link
              to={`/event/${event.id}`}
              aria-label={`${event.title}, ${t('eventsList.participants', { count: event.participants.length })}`}
              className="block px-4 py-3 rounded-lg bg-white dark:bg-teal-800 shadow hover:bg-teal-100 dark:hover:bg-teal-700 transition-colors text-lg font-medium text-teal-700 dark:text-teal-100 border border-teal-100 dark:border-teal-700"
            >
              <div className="flex flex-col">
                <span>{event.title}</span>
                <span className="text-sm text-teal-400" aria-hidden="true">
                  {t('eventsList.participants', { count: event.participants.length })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
