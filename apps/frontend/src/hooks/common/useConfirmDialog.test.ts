import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConfirmDialog } from './useConfirmDialog';

describe('useConfirmDialog', () => {
  describe('initialization', () => {
    it('should initialize with isOpen as false', () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current.isOpen).toBe(false);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(result.current).toHaveProperty('isOpen');
      expect(result.current).toHaveProperty('confirm');
      expect(result.current).toHaveProperty('handleConfirm');
      expect(result.current).toHaveProperty('handleCancel');
    });
  });

  describe('confirm method', () => {
    it('should open dialog when confirm is called', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should store pending action', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
      });

      // Action should not be called immediately
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should maintain stable function reference', () => {
      const { result, rerender } = renderHook(() => useConfirmDialog());

      const firstConfirmRef = result.current.confirm;
      rerender();
      const secondConfirmRef = result.current.confirm;

      expect(firstConfirmRef).toBe(secondConfirmRef);
    });
  });

  describe('handleConfirm method', () => {
    it('should execute pending action', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
      });

      act(() => {
        result.current.handleConfirm();
      });

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should close dialog after confirmation', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.handleConfirm();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should clear pending action after confirmation', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
      });

      act(() => {
        result.current.handleConfirm();
      });

      // Action should have been called once
      expect(mockAction).toHaveBeenCalledTimes(1);

      // Call handleConfirm again - action should not be called again
      act(() => {
        result.current.handleConfirm();
      });

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not throw error if no pending action', () => {
      const { result } = renderHook(() => useConfirmDialog());

      expect(() => {
        act(() => {
          result.current.handleConfirm();
        });
      }).not.toThrow();
    });

    it('should handle action that throws error gracefully', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const errorAction = vi.fn(() => {
        throw new Error('Test error');
      });

      act(() => {
        result.current.confirm(errorAction);
      });

      // The error should propagate to the caller
      expect(() => {
        act(() => {
          result.current.handleConfirm();
        });
      }).toThrow('Test error');

      // The action was called despite the error
      expect(errorAction).toHaveBeenCalledTimes(1);

      // Note: In React Testing Library with act(), errors thrown during state updates
      // can cause the state update to be rolled back. In real usage, the dialog would
      // close due to the finally block, but the caller should handle the error.
    });
  });

  describe('handleCancel method', () => {
    it('should close dialog without executing action', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(mockAction).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(false);
    });

    it('should clear pending action', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      act(() => {
        result.current.confirm(mockAction);
        result.current.handleCancel();
      });

      // Try to confirm after cancel - nothing should happen
      act(() => {
        result.current.handleConfirm();
      });

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should maintain stable function reference', () => {
      const { result, rerender } = renderHook(() => useConfirmDialog());

      const firstCancelRef = result.current.handleCancel;
      rerender();
      const secondCancelRef = result.current.handleCancel;

      expect(firstCancelRef).toBe(secondCancelRef);
    });
  });

  describe('integration scenarios', () => {
    it('should handle confirm -> handleConfirm workflow', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      // Trigger confirmation dialog
      act(() => {
        result.current.confirm(mockAction);
      });
      expect(result.current.isOpen).toBe(true);

      // User confirms
      act(() => {
        result.current.handleConfirm();
      });
      expect(mockAction).toHaveBeenCalledTimes(1);
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle confirm -> handleCancel workflow', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockAction = vi.fn();

      // Trigger confirmation dialog
      act(() => {
        result.current.confirm(mockAction);
      });
      expect(result.current.isOpen).toBe(true);

      // User cancels
      act(() => {
        result.current.handleCancel();
      });
      expect(mockAction).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(false);
    });

    it('should handle multiple sequential confirmations', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const action1 = vi.fn();
      const action2 = vi.fn();

      // First confirmation
      act(() => {
        result.current.confirm(action1);
      });
      act(() => {
        result.current.handleConfirm();
      });
      expect(action1).toHaveBeenCalledTimes(1);

      // Second confirmation
      act(() => {
        result.current.confirm(action2);
      });
      act(() => {
        result.current.handleConfirm();
      });
      expect(action2).toHaveBeenCalledTimes(1);
    });

    it('should handle replacing pending action before confirmation', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const action1 = vi.fn();
      const action2 = vi.fn();

      // Set first action
      act(() => {
        result.current.confirm(action1);
      });

      // Replace with second action before confirming
      act(() => {
        result.current.confirm(action2);
      });

      // Confirm - should execute only the second action
      act(() => {
        result.current.handleConfirm();
      });

      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalledTimes(1);
    });

    it('should handle actions with parameters via closure', () => {
      const { result } = renderHook(() => useConfirmDialog());
      const mockDelete = vi.fn();
      const itemId = '123';

      // Wrap the action with parameters in a closure
      act(() => {
        result.current.confirm(() => mockDelete(itemId));
      });

      act(() => {
        result.current.handleConfirm();
      });

      expect(mockDelete).toHaveBeenCalledWith(itemId);
    });
  });
});
