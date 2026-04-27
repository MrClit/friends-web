import { act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useThemeStore } from './useThemeStore';

function makeMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    trigger: (newMatches: boolean) => {
      listeners.forEach((cb) => cb({ matches: newMatches } as MediaQueryListEvent));
    },
  };
}

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    useThemeStore.getState().cleanup();
    document.documentElement.classList.remove('dark');
    vi.unstubAllGlobals();
  });

  describe('setMode', () => {
    it('adds "dark" class and saves to localStorage when set to dark', () => {
      act(() => {
        useThemeStore.getState().setMode('dark');
      });
      expect(useThemeStore.getState().mode).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('removes "dark" class and saves to localStorage when set to light', () => {
      useThemeStore.setState({ mode: 'dark' });
      document.documentElement.classList.add('dark');
      act(() => {
        useThemeStore.getState().setMode('light');
      });
      expect(useThemeStore.getState().mode).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('is idempotent: skips DOM operations when mode is already active', () => {
      act(() => {
        useThemeStore.getState().setMode('light');
      });
      const addSpy = vi.spyOn(document.documentElement.classList, 'add');
      const removeSpy = vi.spyOn(document.documentElement.classList, 'remove');
      act(() => {
        useThemeStore.getState().setMode('light');
      });
      expect(addSpy).not.toHaveBeenCalled();
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('switches from light to dark', () => {
      act(() => {
        useThemeStore.getState().toggle();
      });
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('switches from dark to light', () => {
      useThemeStore.setState({ mode: 'dark' });
      act(() => {
        useThemeStore.getState().toggle();
      });
      expect(useThemeStore.getState().mode).toBe('light');
    });
  });

  describe('init', () => {
    it('sets dark mode from localStorage when saved theme is "dark"', () => {
      localStorage.setItem('theme', 'dark');
      act(() => {
        useThemeStore.getState().init();
      });
      expect(useThemeStore.getState().mode).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('sets light mode from localStorage when saved theme is "light"', () => {
      localStorage.setItem('theme', 'light');
      act(() => {
        useThemeStore.getState().init();
      });
      expect(useThemeStore.getState().mode).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('uses system dark preference when no theme is saved', () => {
      const mq = makeMatchMedia(true);
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));

      act(() => {
        useThemeStore.getState().init();
      });

      expect(useThemeStore.getState().mode).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('uses system light preference when no theme is saved', () => {
      const mq = makeMatchMedia(false);
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));

      act(() => {
        useThemeStore.getState().init();
      });

      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('responds to system preference changes when no user preference is saved', () => {
      const mq = makeMatchMedia(false);
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));

      act(() => {
        useThemeStore.getState().init();
      });
      expect(useThemeStore.getState().mode).toBe('light');

      act(() => {
        mq.trigger(true);
      });
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('does not register a system listener when user has a saved preference', () => {
      localStorage.setItem('theme', 'light');
      const mq = makeMatchMedia(false);
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));

      act(() => {
        useThemeStore.getState().init();
      });

      expect(window.matchMedia).not.toHaveBeenCalled();
    });

    it('system preference change is ignored after user sets a preference', () => {
      const mq = makeMatchMedia(false);
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));

      act(() => {
        useThemeStore.getState().init();
      });

      // User manually sets preference
      localStorage.setItem('theme', 'light');

      act(() => {
        mq.trigger(true);
      });
      // Should stay light because localStorage has a preference
      expect(useThemeStore.getState().mode).toBe('light');
    });
  });

  describe('cleanup', () => {
    it('removes the system preference event listener', () => {
      const mq = makeMatchMedia(false);
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));

      act(() => {
        useThemeStore.getState().init();
      });
      act(() => {
        useThemeStore.getState().cleanup();
      });

      act(() => {
        mq.trigger(true);
      });
      // Mode should remain light since listener was removed
      expect(useThemeStore.getState().mode).toBe('light');
    });
  });
});
