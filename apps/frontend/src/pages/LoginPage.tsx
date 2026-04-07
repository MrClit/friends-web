import { GoogleLoginButton } from '@/features/auth/GoogleLoginButton';
import { MicrosoftLoginButton } from '@/features/auth/MicrosoftLoginButton';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';

const AUTH_NAMESPACES = ['auth'] as const;

export function LoginPage() {
  const { t } = useTranslation(AUTH_NAMESPACES);
  const currentYear = new Date().getFullYear();
  const isI18nReady = useI18nNamespacesReady(AUTH_NAMESPACES);

  if (!isI18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-0 bg-linear-to-b from-teal-100 to-teal-300 dark:from-teal-900 dark:to-teal-950">
        <p className="text-teal-800 dark:text-teal-200">{t('loading', { ns: 'auth', defaultValue: 'Loading...' })}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-0 bg-linear-to-b from-teal-100 to-teal-300 dark:from-teal-900 dark:to-teal-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center">
        <Logo showText size={80} />
        <h1 className="text-2xl font-bold mb-2 text-teal-800 dark:text-teal-200">{t('loginPage.title')}</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">
          {t('loginPage.description')}
          <br />
          {t('loginPage.continueWithProvider')}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <GoogleLoginButton />
          <MicrosoftLoginButton />
        </div>
      </div>
      <footer className="mt-8 text-xs text-gray-400">{t('loginPage.footer', { year: currentYear })}</footer>
    </div>
  );
}
