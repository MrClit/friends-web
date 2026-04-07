import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LogoIcon } from '@/shared/components/Logo';
import { LanguageSelector } from '@/shared/components/Header';
import { ThemeToggle } from '@/shared/components/Header';
import { UserMenu } from '@/shared/components/Header';

/**
 * Main application header with logo, language selector, theme toggle, and user menu.
 * Responsive and accessible layout.
 */
export function Header() {
  const { t } = useTranslation(['header', 'notFound']);
  return (
    <nav
      role="navigation"
      aria-label={t('ariaLabel', { ns: 'header', defaultValue: 'Barra de navegación principal' })}
      className="sticky top-0 z-50 px-6 py-4 border-b border-emerald-100 dark:border-emerald-800/50 bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(2,44,34,0.8)] backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          aria-label={t('goHome', { ns: 'notFound' })}
          className="group flex items-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-emerald-950"
        >
          <LogoIcon size={40} rounded="xl" />

          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-slate-700 dark:text-white dark:group-hover:text-emerald-100">
            FRI<span className="text-yellow-400">€</span>NDS
          </h1>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSelector />
          <ThemeToggle />
          <div className="h-8 w-px bg-emerald-100 dark:bg-emerald-800 mx-2" />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
