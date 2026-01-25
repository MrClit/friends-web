import { MdBrightness4, MdBrightness7 } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/shared/store/useThemeStore';

/**
 * Dark mode toggle button with i18n support and icon animation.
 */
export default function ThemeToggle() {
  const { mode, toggle } = useThemeStore();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggle}
      aria-label={
        mode === 'dark'
          ? t('theme.toggleDark', 'Cambiar a modo claro')
          : t('theme.toggleLight', 'Cambiar a modo oscuro')
      }
      className="p-2 rounded-lg border border-slate-200 dark:border-emerald-800 hover:bg-white dark:hover:bg-emerald-900/50 transition-all cursor-pointer"
    >
      {mode === 'dark' ? (
        <MdBrightness7 className="text-yellow-400 text-xl transition-all duration-300 ease-in-out" />
      ) : (
        <MdBrightness4 className="text-teal-600 text-xl transition-all duration-300 ease-in-out" />
      )}
    </button>
  );
}
