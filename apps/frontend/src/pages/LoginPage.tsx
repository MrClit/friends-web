import { GoogleLoginButton } from '@/features/auth/GoogleLoginButton';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components';

export function LoginPage() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-0 bg-linear-to-b from-teal-100 to-teal-300 dark:from-teal-900 dark:to-teal-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center">
        <Logo showText size={80} />
        <h1 className="text-2xl font-bold mb-2 text-teal-800 dark:text-teal-200">{t('auth.loginPage.title')}</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">
          {t('auth.loginPage.description')}
          <br />
          {t('auth.loginPage.continueWithGoogle')}
        </p>
        <GoogleLoginButton />
      </div>
      <footer className="mt-8 text-xs text-gray-400">{t('auth.loginPage.footer', { year: currentYear })}</footer>
    </div>
  );
}
