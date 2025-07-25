import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import type { ThemeState } from '../store/useThemeStore';

export default function ThemeInitializer() {
  const init = useThemeStore((state: ThemeState) => state.init);
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
