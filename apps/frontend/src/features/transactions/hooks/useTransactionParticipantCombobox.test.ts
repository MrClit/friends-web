import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import {
  useTransactionParticipantCombobox,
  type TransactionParticipantOption,
} from './useTransactionParticipantCombobox';

const option = (id: string): TransactionParticipantOption => ({ id, label: `Participant ${id}` });

const keyDown = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as React.KeyboardEvent<HTMLInputElement>;

const renderCombobox = (options: TransactionParticipantOption[]) =>
  renderHook((props) => useTransactionParticipantCombobox(props), {
    initialProps: { value: '', options, onChange: vi.fn() },
  });

describe('useTransactionParticipantCombobox', () => {
  it('clamps the highlighted index when the options shrink under it', () => {
    const { result, rerender } = renderCombobox([option('1'), option('2'), option('3')]);

    act(() => result.current.setHighlightedIndex(2));
    rerender({ value: '', options: [option('1'), option('2')], onChange: vi.fn() });

    expect(result.current.highlightedIndex).toBe(1);
  });

  it('moves up from the clamped index, not from the stale one', () => {
    const { result, rerender } = renderCombobox([option('1'), option('2'), option('3'), option('4')]);

    act(() => result.current.setHighlightedIndex(3));
    rerender({ value: '', options: [option('1'), option('2')], onChange: vi.fn() });
    act(() => result.current.handleSearchKeyDown(keyDown('ArrowUp')));

    expect(result.current.highlightedIndex).toBe(0);
  });

  it('highlights nothing once every option is gone', () => {
    const { result, rerender } = renderCombobox([option('1')]);

    act(() => result.current.setHighlightedIndex(0));
    rerender({ value: '', options: [], onChange: vi.fn() });

    expect(result.current.highlightedIndex).toBe(-1);
  });

  it('selects the clamped option on Enter', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook((props) => useTransactionParticipantCombobox(props), {
      initialProps: { value: '', options: [option('1'), option('2'), option('3')], onChange },
    });

    act(() => result.current.setHighlightedIndex(2));
    rerender({ value: '', options: [option('1'), option('2')], onChange });
    act(() => result.current.handleSearchKeyDown(keyDown('Enter')));

    expect(onChange).toHaveBeenCalledWith('2');
  });
});
