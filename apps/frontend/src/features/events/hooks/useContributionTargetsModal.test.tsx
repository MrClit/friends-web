import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventParticipant } from '../types';
import { useContributionTargetsModal } from './useContributionTargetsModal';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

// Partial mock: the hook only needs `t`, but the module is also imported
// transitively by the i18n bootstrap, which needs the real `initReactI18next`.
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mutation = { mutate: vi.fn(), isPending: false };

vi.mock('@/hooks/api/useEvents', () => ({
  useUpdateEvent: () => mutation,
}));

const pot: EventParticipant = { type: 'pot', id: '0' };
const participants: EventParticipant[] = [
  { type: 'user', id: 'u1', name: 'Alice', contributionTarget: 30 },
  { type: 'guest', id: 'g1', name: 'Guest' },
  pot,
];

type MutateOptions = { onSuccess?: () => void; onError?: (error: Error) => void };

function renderModal(options: { open?: boolean; onClose?: () => void; list?: EventParticipant[] } = {}) {
  const onClose = options.onClose ?? vi.fn();
  const hook = renderHook(() =>
    useContributionTargetsModal({
      open: options.open ?? true,
      eventId: 'event-1',
      participants: options.list ?? participants,
      onClose,
    }),
  );
  return { ...hook, onClose };
}

describe('useContributionTargetsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds the draft from the event participants and starts pristine', () => {
    const { result } = renderModal();

    expect(result.current.draft).toEqual(participants);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.targetTotal).toBe(30);
    expect(result.current.hasEditableParticipants).toBe(true);
  });

  it('reports no editable participants when only the pot is present', () => {
    const { result } = renderModal({ list: [pot] });

    expect(result.current.hasEditableParticipants).toBe(false);
  });

  it('sets a target and becomes dirty', () => {
    const { result } = renderModal();

    act(() => {
      result.current.setTarget(1, 20);
    });

    expect(result.current.draft[1]).toEqual({ type: 'guest', id: 'g1', name: 'Guest', contributionTarget: 20 });
    expect(result.current.targetTotal).toBe(50);
    expect(result.current.isDirty).toBe(true);
  });

  it('removes the key when a target is set to zero', () => {
    const { result } = renderModal();

    act(() => {
      result.current.setTarget(0, 0);
    });

    expect(result.current.draft[0]).not.toHaveProperty('contributionTarget');
    expect(result.current.isDirty).toBe(true);
  });

  it('fills every row from the total expenses and keeps the pot untouched', () => {
    const { result } = renderModal();

    act(() => {
      result.current.calculateTargets(100);
    });

    // Existing targets are the weights: 30 vs the default 1 for the guest without one.
    expect(result.current.targetTotal).toBe(100);
    expect(result.current.draft[2]).toBe(pot);
    expect(result.current.isDirty).toBe(true);
  });

  it('does not save while pristine', () => {
    const { result } = renderModal();

    act(() => {
      result.current.handleSave();
    });

    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it('saves the full participants array in one request and closes on success', () => {
    const { result, onClose } = renderModal();

    act(() => {
      result.current.setTarget(0, 0);
      result.current.setTarget(1, 45.5);
    });
    act(() => {
      result.current.handleSave();
    });

    expect(mutation.mutate).toHaveBeenCalledTimes(1);
    const [payload, options] = mutation.mutate.mock.calls[0] as [
      { id: string; data: { participants: EventParticipant[] } },
      MutateOptions,
    ];
    expect(payload.id).toBe('event-1');
    expect(payload.data).toEqual({
      participants: [
        { type: 'user', id: 'u1', name: 'Alice' },
        { type: 'guest', id: 'g1', name: 'Guest', contributionTarget: 45.5 },
        pot,
      ],
    });
    expect(payload.data.participants[0]).not.toHaveProperty('contributionTarget');

    act(() => {
      options.onSuccess?.();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the server error and keeps the draft on failure', () => {
    const { result, onClose } = renderModal();

    act(() => {
      result.current.setTarget(1, 12);
    });
    act(() => {
      result.current.handleSave();
    });

    const [, options] = mutation.mutate.mock.calls[0] as [unknown, MutateOptions];
    act(() => {
      options.onError?.(new Error('boom'));
    });

    expect(result.current.errorMessage).toBe('errors.default');
    expect(result.current.draft[1]).toEqual({ type: 'guest', id: 'g1', name: 'Guest', contributionTarget: 12 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('asks for confirmation before closing with unsaved changes', () => {
    const { result, onClose } = renderModal();

    act(() => {
      result.current.setTarget(1, 12);
    });
    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(result.current.showDiscardConfirm).toBe(true);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.handleCancelDiscard();
    });

    expect(result.current.showDiscardConfirm).toBe(false);
    expect(result.current.draft[1]).toEqual({ type: 'guest', id: 'g1', name: 'Guest', contributionTarget: 12 });
  });

  it('discards the draft and closes when the discard is confirmed', () => {
    const { result, onClose } = renderModal();

    act(() => {
      result.current.setTarget(1, 12);
    });
    act(() => {
      result.current.handleOpenChange(false);
    });
    act(() => {
      result.current.handleConfirmDiscard();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.draft).toEqual(participants);
    expect(result.current.isDirty).toBe(false);
  });

  it('closes straight away when nothing changed', () => {
    const { result, onClose } = renderModal();

    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(result.current.showDiscardConfirm).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
