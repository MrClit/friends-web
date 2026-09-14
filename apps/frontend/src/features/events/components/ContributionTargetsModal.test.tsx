import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventParticipant } from '../types';
import { ContributionTargetsModal } from './ContributionTargetsModal';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) => (options?.name ? `${key}:${options.name}` : key),
  }),
}));

vi.mock('@/shared/utils/format', () => ({
  formatAmount: (amount: number) => `${amount} €`,
}));

const mutation = { mutate: vi.fn(), isPending: false };

vi.mock('@/hooks/api/useEvents', () => ({
  useUpdateEvent: () => mutation,
}));

type MutateOptions = { onSuccess?: () => void; onError?: (error: Error) => void };

const pot: EventParticipant = { type: 'pot', id: '0' };
const participants: EventParticipant[] = [
  { type: 'user', id: 'u1', name: 'Alice', email: 'alice@example.com', contributionTarget: 30 },
  { type: 'guest', id: 'g1', name: 'Guest' },
  pot,
];

function renderModal(props: { list?: EventParticipant[]; totalExpenses?: number; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  const utils = render(
    <ContributionTargetsModal
      open
      eventId="event-1"
      participants={props.list ?? participants}
      totalExpenses={props.totalExpenses ?? 0}
      onClose={onClose}
    />,
  );
  return { ...utils, onClose };
}

const getSaveButtons = () => screen.getAllByRole('button', { name: 'targets.modal.save' });
const clickSave = () => fireEvent.click(getSaveButtons()[0]);

describe('ContributionTargetsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one input per user or guest participant and none for the pot', () => {
    renderModal();

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    expect(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Alice' })).toHaveValue(30);
    expect(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' })).toHaveValue(null);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('focuses the first target input on open', () => {
    renderModal();

    expect(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Alice' })).toHaveFocus();
  });

  it('clamps negatives to zero and rounds to two decimals', () => {
    renderModal();
    const guestInput = screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' });

    fireEvent.change(guestInput, { target: { value: '12.345' } });
    expect(guestInput).toHaveValue(12.35);

    fireEvent.change(guestInput, { target: { value: '-3' } });
    expect(guestInput).toHaveValue(null);
  });

  it('updates the totals row while typing', () => {
    renderModal({ totalExpenses: 100 });
    const totals = screen.getByText('targets.modal.totalLabel').closest('dl') as HTMLElement;

    expect(within(totals).getByText('30 €')).toBeInTheDocument();
    expect(within(totals).getByText('100 €')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' }), {
      target: { value: '20' },
    });

    expect(within(totals).getByText('50 €')).toBeInTheDocument();
  });

  it('hides the calculate button without expenses', () => {
    renderModal({ totalExpenses: 0 });

    expect(screen.queryByRole('button', { name: 'targets.modal.calculateAria' })).not.toBeInTheDocument();
  });

  it('fills every row proportionally from the expenses', () => {
    renderModal({
      list: [{ type: 'user', id: 'u1', name: 'Alice' }, { type: 'guest', id: 'g1', name: 'Guest' }, pot],
      totalExpenses: 100,
    });

    fireEvent.click(screen.getByRole('button', { name: 'targets.modal.calculateAria' }));

    expect(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Alice' })).toHaveValue(50);
    expect(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' })).toHaveValue(50);
  });

  it('keeps save disabled until something changes', () => {
    renderModal();

    getSaveButtons().forEach((button) => expect(button).toBeDisabled());

    fireEvent.change(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' }), {
      target: { value: '20' },
    });

    getSaveButtons().forEach((button) => expect(button).toBeEnabled());
  });

  it('saves the full participants array with the pot untouched and zeroed targets stripped', () => {
    renderModal();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Alice' }), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' }), {
      target: { value: '20' },
    });
    clickSave();

    expect(mutation.mutate).toHaveBeenCalledTimes(1);
    const [payload] = mutation.mutate.mock.calls[0] as [{ id: string; data: { participants: EventParticipant[] } }];
    expect(payload).toEqual({
      id: 'event-1',
      data: {
        participants: [
          { type: 'user', id: 'u1', name: 'Alice', email: 'alice@example.com' },
          { type: 'guest', id: 'g1', name: 'Guest', contributionTarget: 20 },
          pot,
        ],
      },
    });
    expect(payload.data.participants[0]).not.toHaveProperty('contributionTarget');
  });

  it('shows the server error and keeps the typed values', () => {
    renderModal();
    const guestInput = screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' });

    fireEvent.change(guestInput, { target: { value: '20' } });
    clickSave();

    const [, options] = mutation.mutate.mock.calls[0] as [unknown, MutateOptions];
    act(() => {
      options.onError?.(new Error('boom'));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('errors.default');
    expect(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' })).toHaveValue(20);
  });

  it('asks for confirmation before closing with unsaved changes', () => {
    const { onClose } = renderModal();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'targets.modal.targetAria:Guest' }), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'targets.modal.cancel' })[0]);

    expect(screen.getByText('targets.modal.discardTitle')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'targets.modal.discard' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes straight away when nothing changed', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getAllByRole('button', { name: 'targets.modal.cancel' })[0]);

    expect(screen.queryByText('targets.modal.discardTitle')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when only the pot is a participant', () => {
    renderModal({ list: [pot], totalExpenses: 100 });

    expect(screen.getByText('targets.modal.empty')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'targets.modal.calculateAria' })).not.toBeInTheDocument();
    getSaveButtons().forEach((button) => expect(button).toBeDisabled());
  });
});
