import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeStore } from '../store/useThemeStore';

export default function DarkModeToggle() {
  const { mode, toggle } = useThemeStore();

  return (
    <IconButton
      aria-label={mode === 'dark' ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
      onClick={toggle}
      className="bg-white/90 dark:bg-teal-950/90 border border-teal-300 dark:border-teal-800 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-teal-400 h-10 w-10 flex items-center justify-center hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
      size="small"
      sx={{ borderRadius: 8, width: 40, height: 40, padding: 0 }}
    >
      {mode === 'dark' ? <Brightness7Icon className="text-yellow-400" /> : <Brightness4Icon className="text-teal-600" />}
    </IconButton>
  );
}
