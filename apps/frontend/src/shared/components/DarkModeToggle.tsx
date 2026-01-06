import { MdBrightness4, MdBrightness7 } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import IconButton from './IconButton';

/**
 * Dark mode toggle button with i18n support and icon animation.
 */
export default function DarkModeToggle() {
  const { mode, toggle } = useThemeStore();
  const { t } = useTranslation();

  return (
    <IconButton onClick={toggle} ariaLabel={mode === 'dark' ? t('theme.toggleDark') : t('theme.toggleLight')}>
      {mode === 'dark' ? (
        <MdBrightness7 className="text-yellow-400 text-xl transition-all duration-300 ease-in-out" />
      ) : (
        <MdBrightness4 className="text-teal-600 text-xl transition-all duration-300 ease-in-out" />
      )}
    </IconButton>
  );
}
