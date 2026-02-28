import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useModalForm } from './useModalForm';

describe('useModalForm', () => {
  const defaultOptions = () => ({
    open: true,
    isDirty: false,
    resetForm: vi.fn(),
    onClose: vi.fn(),
  });

  describe('initialization', () => {
    it('should initialize with discard confirm hidden', () => {
      const { result } = renderHook(() => useModalForm(defaultOptions()));
      expect(result.current.showDiscardConfirm).toBe(false);
    });

    it('should initialize with no error message', () => {
      const { result } = renderHook(() => useModalForm(defaultOptions()));
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('reset on open', () => {
    it('should call resetForm when open changes to true', () => {
      const opts = { ...defaultOptions(), open: false };
      const { rerender } = renderHook((props) => useModalForm(props), { initialProps: opts });

      const resetForm = vi.fn();
      rerender({ ...opts, open: true, resetForm });

      expect(resetForm).toHaveBeenCalled();
    });

    it('should not call resetForm when open is false', () => {
      const resetForm = vi.fn();
      renderHook(() => useModalForm({ ...defaultOptions(), open: false, resetForm }));
      expect(resetForm).not.toHaveBeenCalled();
    });
  });

  describe('handleOpenChange', () => {
    it('should close without confirm when form is not dirty', () => {
      const opts = defaultOptions();
      const { result } = renderHook(() => useModalForm(opts));

      act(() => {
        result.current.handleOpenChange(false);
      });

      expect(opts.onClose).toHaveBeenCalled();
      expect(opts.resetForm).toHaveBeenCalled();
    });

    it('should show discard confirm when form is dirty', () => {
      const opts = { ...defaultOptions(), isDirty: true };
      const { result } = renderHook(() => useModalForm(opts));

      act(() => {
        result.current.handleOpenChange(false);
      });

      expect(result.current.showDiscardConfirm).toBe(true);
      expect(opts.onClose).not.toHaveBeenCalled();
    });

    it('should not close when discard confirm is already showing', () => {
      const opts = { ...defaultOptions(), isDirty: true };
      const { result } = renderHook(() => useModalForm(opts));

      // First attempt shows confirm
      act(() => {
        result.current.handleOpenChange(false);
      });
      expect(result.current.showDiscardConfirm).toBe(true);

      // Second attempt should be blocked
      act(() => {
        result.current.handleOpenChange(false);
      });
      expect(opts.onClose).not.toHaveBeenCalled();
    });

    it('should not close when extra blockers are active', () => {
      const opts = { ...defaultOptions(), extraBlockers: [true] };
      const { result } = renderHook(() => useModalForm(opts));

      act(() => {
        result.current.handleOpenChange(false);
      });

      expect(opts.onClose).not.toHaveBeenCalled();
    });

    it('should do nothing when opening (isOpen=true)', () => {
      const opts = defaultOptions();
      const { result } = renderHook(() => useModalForm(opts));

      act(() => {
        result.current.handleOpenChange(true);
      });

      expect(result.current.showDiscardConfirm).toBe(false);
    });
  });

  describe('handleConfirmDiscard', () => {
    it('should close the modal and reset form', () => {
      const opts = { ...defaultOptions(), isDirty: true };
      const { result } = renderHook(() => useModalForm(opts));

      // Show discard confirm first
      act(() => {
        result.current.handleOpenChange(false);
      });

      // Confirm discard
      act(() => {
        result.current.handleConfirmDiscard();
      });

      expect(result.current.showDiscardConfirm).toBe(false);
      expect(opts.resetForm).toHaveBeenCalled();
      expect(opts.onClose).toHaveBeenCalled();
    });
  });

  describe('handleCancelDiscard', () => {
    it('should hide discard confirm without closing', () => {
      const opts = { ...defaultOptions(), isDirty: true };
      const { result } = renderHook(() => useModalForm(opts));

      // Show discard confirm
      act(() => {
        result.current.handleOpenChange(false);
      });
      expect(result.current.showDiscardConfirm).toBe(true);

      // Cancel discard
      act(() => {
        result.current.handleCancelDiscard();
      });

      expect(result.current.showDiscardConfirm).toBe(false);
      expect(opts.onClose).not.toHaveBeenCalled();
    });
  });

  describe('error message', () => {
    it('should set and clear error message', () => {
      const { result } = renderHook(() => useModalForm(defaultOptions()));

      act(() => {
        result.current.setErrorMessage('Something went wrong');
      });
      expect(result.current.errorMessage).toBe('Something went wrong');

      act(() => {
        result.current.setErrorMessage(null);
      });
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('closeAndReset', () => {
    it('should clear all state, reset form, and close', () => {
      const opts = { ...defaultOptions(), isDirty: true };
      const { result } = renderHook(() => useModalForm(opts));

      // Set up some state
      act(() => {
        result.current.setErrorMessage('error');
        result.current.handleOpenChange(false); // shows discard confirm
      });

      // Close and reset
      act(() => {
        result.current.closeAndReset();
      });

      expect(result.current.showDiscardConfirm).toBe(false);
      expect(result.current.errorMessage).toBeNull();
      expect(opts.resetForm).toHaveBeenCalled();
      expect(opts.onClose).toHaveBeenCalled();
    });
  });
});
