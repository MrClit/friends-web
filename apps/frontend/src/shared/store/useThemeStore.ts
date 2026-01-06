import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  init: () => void;
  cleanup: () => void;
}

// Helper to validate theme value from localStorage
const isValidThemeMode = (value: string | null): value is ThemeMode => {
  return value === 'light' || value === 'dark';
};

// Store reference to cleanup function outside the store
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let mediaQuery: MediaQueryList | null = null;

/**
 * Theme store with dark/light mode management.
 * Automatically syncs with localStorage and system preferences.
 * Call cleanup() when unmounting (e.g., in app cleanup).
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',

  setMode: (mode) => {
    // Skip if mode is already set (avoid redundant DOM operations)
    if (get().mode === mode) return;

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

    // Validate and use saved preference
    const saved = localStorage.getItem('theme');
    if (isValidThemeMode(saved)) {
      set({ mode: saved }); // Set state directly without redundant DOM operations
      document.documentElement.classList.toggle('dark', saved === 'dark');
      return;
    }

    // Use system preference if no valid saved value
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemMode: ThemeMode = systemPrefersDark ? 'dark' : 'light';
    set({ mode: systemMode });
    document.documentElement.classList.toggle('dark', systemMode === 'dark');

    // Listen to system preference changes only if no user preference is saved
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryListener = (e: MediaQueryListEvent) => {
      // Only respond to system changes if user hasn't set a preference
      if (!isValidThemeMode(localStorage.getItem('theme'))) {
        get().setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', mediaQueryListener);
  },

  cleanup: () => {
    // Remove event listener to prevent memory leaks
    if (mediaQuery && mediaQueryListener) {
      mediaQuery.removeEventListener('change', mediaQueryListener);
      mediaQueryListener = null;
      mediaQuery = null;
    }
  },
}));
