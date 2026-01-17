import { MdBrightness4, MdBrightness7 } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';

/**
 * Dark mode toggle button with i18n support and icon animation.
 */
export default function DarkModeToggle() {
  const { mode, toggle } = useThemeStore();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggle}
      aria-label={mode === 'dark' ? t('theme.toggleDark', 'Cambiar a modo claro') : t('theme.toggleLight', 'Cambiar a modo oscuro')}
      className="rounded-full border-2 border-teal-400 dark:border-teal-700 p-2 bg-transparent hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      {mode === 'dark' ? (
        <MdBrightness7 className="text-yellow-400 text-xl transition-all duration-300 ease-in-out" />
      ) : (
        <MdBrightness4 className="text-teal-600 text-xl transition-all duration-300 ease-in-out" />
      )}
    </button>
  );
}
