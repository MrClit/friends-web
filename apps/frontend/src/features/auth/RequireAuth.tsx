import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import { AppLoadingFallback } from '@/shared/components/AppLoadingFallback';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading, error } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return <AppLoadingFallback />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-emerald-950 px-6 transition-colors duration-300">
        <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-md">{t('auth.error')}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {t('auth.retry')}
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
