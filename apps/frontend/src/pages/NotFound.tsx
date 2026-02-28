import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from './MainLayout';

export function NotFound() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-7xl font-extrabold text-teal-600 dark:text-teal-400">404</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{t('notFound.title')}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('notFound.message')}</p>
        <Link
          to="/"
          className="mt-6 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {t('notFound.goHome')}
        </Link>
      </div>
    </MainLayout>
  );
}
