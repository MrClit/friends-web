import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation('common');

  return (
    <div className="w-full max-w-7xl mx-auto mt-4 sm:mt-8">
      <div className="text-center py-8 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 font-medium">{message || t('errorLoading')}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {t('retry')}
          </button>
        )}
      </div>
    </div>
  );
}
