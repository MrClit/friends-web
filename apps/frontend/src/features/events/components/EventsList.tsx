import { useEventsStore } from '../store/useEventsStore';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function EventsList() {
  const events = useEventsStore((state) => state.events);
  const { t } = useTranslation();

  if (events.length === 0) {
    return <div className="text-center text-teal-400">{t('eventsList.noEvents')}</div>;
  }

  return (
    <div className="w-full max-w-2xl mt-8">
      <h2 className="text-xl font-semibold mb-4 text-teal-700 dark:text-teal-200">
        {t('eventsList.title')}
      </h2>
      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              to={`/event/${event.id}`}
              className="block px-4 py-3 rounded-lg bg-white dark:bg-teal-800 shadow hover:bg-teal-100 dark:hover:bg-teal-700 transition-colors text-lg font-medium text-teal-700 dark:text-teal-100 border border-teal-100 dark:border-teal-700"
            >
              <div className="flex flex-col">
                <span>{event.title}</span>
                <span className="text-sm text-teal-400">
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
