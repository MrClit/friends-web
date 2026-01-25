import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components';
import { LanguageSelector } from '@/shared/components/Header';
import { ThemeToggle } from '@/shared/components/Header';
import { UserMenu } from '@/shared/components/Header';

/**
 * Main application header with logo, language selector, theme toggle, and user menu.
 * Responsive and accessible layout.
 */
export default function Header() {
  const { t } = useTranslation();
  return (
    <nav
      role="navigation"
      aria-label={t('header.ariaLabel', 'Barra de navegación principal')}
      className="sticky top-0 z-50 px-6 py-4 border-b border-emerald-100 dark:border-emerald-800/50 bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(2,44,34,0.8)] backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo showText={false} size={40} />

          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            FRI<span className="text-yellow-400">€</span>NDS
          </h1>
        </div>

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
