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
    <header
      role="banner"
      aria-label={t('header.ariaLabel', 'Barra de navegación principal')}
      className="w-full sticky top-0 z-30"
    >
      <div className="max-w-2xl mx-auto shadow-sm px-2 py-2 flex items-center justify-between gap-2 rounded-b-xl">
        {/* Left: Logo (icono) + Language */}
        <div className="flex items-center gap-2 min-w-0">
          <Logo showText={false} size={40} />
          <div className="ml-2">
            <div className="rounded-lg px-1 py-1 transition-colors hover:bg-teal-100 dark:hover:bg-teal-800">
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* Center: (opcional) título de página */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          {/* Aquí podría ir el título de la página si se desea */}
        </div>

        {/* Right: Theme toggle + User menu */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1 transition-colors hover:bg-teal-100 dark:hover:bg-teal-800">
            <ThemeToggle />
          </div>
          <div className="rounded-lg p-1 transition-colors hover:bg-teal-100 dark:hover:bg-teal-800">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
