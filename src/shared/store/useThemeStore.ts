import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  setMode: (mode) => {
    set({ mode });
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  },
  toggle: () => {
    const newMode = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(newMode);
  },
  init: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      get().setMode(saved);
      return;
    }
    // Si no hay preferencia guardada, usa la del sistema
    const getSystemPref = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    get().setMode(getSystemPref() ? 'dark' : 'light');
    // Escucha cambios del sistema solo si no hay preferencia guardada
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        get().setMode(e.matches ? 'dark' : 'light');
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    }
  },
}));
