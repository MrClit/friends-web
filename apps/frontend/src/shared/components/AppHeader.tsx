import DarkModeToggle from './DarkModeToggle';
import LanguageMenu from './LanguageMenu';
import Logo from './Logo';

/**
 * Application header component with dark mode toggle, logo, and language selector.
 * Uses grid layout to ensure perfect centering of logo with controls on sides.
 */
export default function AppHeader() {
  return (
    <header role="banner" className="w-full max-w-2xl grid grid-cols-[auto_1fr_auto] items-start gap-2 mb-8">
      <DarkModeToggle />
      <div className="flex justify-center">
        <Logo />
      </div>
      <LanguageMenu />
    </header>
  );
}
