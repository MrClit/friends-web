import { MdBrightness4, MdBrightness7 } from 'react-icons/md';
import { useThemeStore } from '../store/useThemeStore';

export default function DarkModeToggle() {
  const { mode, toggle } = useThemeStore();

  return (
    <button
      type="button"
      aria-label={mode === 'dark' ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
      onClick={toggle}
      className="bg-white/90 dark:bg-teal-950/90 border border-teal-300 dark:border-teal-800 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-teal-400 h-10 w-10 flex items-center justify-center hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
    >
      {mode === 'dark' ? (
        <MdBrightness7 className="text-yellow-400 text-xl" />
      ) : (
        <MdBrightness4 className="text-teal-600 text-xl" />
      )}
    </button>
  );
}
