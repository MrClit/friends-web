import { useTranslation } from 'react-i18next';
import { Header } from '@/shared/components/Header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex flex-col bg-radial from-emerald-100 via-emerald-50 to-white dark:from-emerald-900 dark:via-emerald-900 dark:to-emerald-900 transition-colors duration-300">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
