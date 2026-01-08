import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useModalState } from './useModalState';

describe('useModalState', () => {
  describe('initialization', () => {
    it('should initialize with isOpen as false by default', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isOpen).toBe(false);
    });

    it('should initialize with custom initial value', () => {
      const { result } = renderHook(() => useModalState(true));

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('open method', () => {
    it('should set isOpen to true', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should remain true when called multiple times', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.open();
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should maintain stable function reference', () => {
      const { result, rerender } = renderHook(() => useModalState());

      const firstOpenRef = result.current.open;
      rerender();
      const secondOpenRef = result.current.open;

      expect(firstOpenRef).toBe(secondOpenRef);
    });
  });

  describe('close method', () => {
    it('should set isOpen to false', () => {
      const { result } = renderHook(() => useModalState(true));

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should remain false when called multiple times', () => {
      const { result } = renderHook(() => useModalState(true));

      act(() => {
        result.current.close();
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should maintain stable function reference', () => {
      const { result, rerender } = renderHook(() => useModalState());

      const firstCloseRef = result.current.close;
      rerender();
      const secondCloseRef = result.current.close;

      expect(firstCloseRef).toBe(secondCloseRef);
    });
  });

  describe('toggle method', () => {
    it('should toggle from false to true', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle from true to false', () => {
      const { result } = renderHook(() => useModalState(true));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.toggle(); // false -> true
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle(); // true -> false
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle(); // false -> true
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('should maintain stable function reference', () => {
      const { result, rerender } = renderHook(() => useModalState());

      const firstToggleRef = result.current.toggle;
      rerender();
      const secondToggleRef = result.current.toggle;

      expect(firstToggleRef).toBe(secondToggleRef);
    });
  });

  describe('integration scenarios', () => {
    it('should handle open -> close workflow', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle toggle -> close workflow', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle open -> toggle workflow', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });
});
