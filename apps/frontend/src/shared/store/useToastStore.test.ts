import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.getState().reset();
  });

  describe('addToast', () => {
    it('assigns a unique id to each toast even when two are created in the same tick', () => {
      act(() => {
        useToastStore.getState().addToast({ type: 'error', message: 'first' });
        useToastStore.getState().addToast({ type: 'error', message: 'second' });
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
      expect(toasts.map((t) => t.message)).toEqual(['first', 'second']);
    });

    it('preserves the toast fields alongside the generated id', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'saved',
          description: 'details',
          duration: 4000,
        });
      });

      expect(useToastStore.getState().toasts).toEqual([
        { id: 'test-uuid-1', type: 'success', message: 'saved', description: 'details', duration: 4000 },
      ]);
    });
  });

  describe('removeToast', () => {
    it('removes only the toast with the given id', () => {
      act(() => {
        useToastStore.getState().addToast({ type: 'error', message: 'first' });
        useToastStore.getState().addToast({ type: 'error', message: 'second' });
      });
      const [first, second] = useToastStore.getState().toasts;

      act(() => {
        useToastStore.getState().removeToast(first.id);
      });

      expect(useToastStore.getState().toasts).toEqual([second]);
    });

    it('leaves the state untouched when the id does not exist', () => {
      act(() => {
        useToastStore.getState().addToast({ type: 'info', message: 'only' });
      });
      const before = useToastStore.getState().toasts;

      act(() => {
        useToastStore.getState().removeToast('missing');
      });

      expect(useToastStore.getState().toasts).toEqual(before);
    });
  });

  describe('reset', () => {
    it('clears every toast', () => {
      act(() => {
        useToastStore.getState().addToast({ type: 'warning', message: 'a' });
        useToastStore.getState().addToast({ type: 'warning', message: 'b' });
      });

      act(() => {
        useToastStore.getState().reset();
      });

      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });
});
