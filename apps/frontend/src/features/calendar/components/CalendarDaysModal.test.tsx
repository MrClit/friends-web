import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MealSlot } from '@friends/shared-types';
import type { CalendarDay } from '@/api/types';
import { CalendarDaysModal } from './CalendarDaysModal';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const handlers = {
  onClose: vi.fn(),
  onAddDays: vi.fn(),
  onUpdateDay: vi.fn(),
  onUpdateMeal: vi.fn(),
  onDeleteDay: vi.fn(),
};

const makeDays = (): CalendarDay[] => [
  {
    id: 'day-1',
    eventId: 'event-1',
    date: '2026-09-12',
    description: 'BAILE DE DISFRACES',
    meals: [
      { id: 'lunch-1', dayId: 'day-1', slot: MealSlot.LUNCH, description: 'Paella', attendances: [] },
      { id: 'dinner-1', dayId: 'day-1', slot: MealSlot.DINNER, description: null, attendances: [] },
    ],
  },
];

const renderModal = (isBusy = false) =>
  render(<CalendarDaysModal open days={makeDays()} isBusy={isBusy} {...handlers} />);

describe('CalendarDaysModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('commits a day description on blur', () => {
    renderModal();

    const input = screen.getByDisplayValue('BAILE DE DISFRACES');
    fireEvent.change(input, { target: { value: 'LLEGADA' } });
    fireEvent.blur(input);

    expect(handlers.onUpdateDay).toHaveBeenCalledWith('day-1', 'LLEGADA');
  });

  it('clears a description with null rather than an empty string', () => {
    renderModal();

    const input = screen.getByDisplayValue('Paella');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);

    expect(handlers.onUpdateMeal).toHaveBeenCalledWith('lunch-1', null);
  });

  it('does not commit when the text did not change', () => {
    renderModal();

    fireEvent.blur(screen.getByDisplayValue('Paella'));

    expect(handlers.onUpdateMeal).not.toHaveBeenCalled();
  });

  /**
   * Tabbing out of a description commits it, which flips isBusy. Disabling the field that just took
   * focus would drop focus to the body and throw the user out of the form, so isBusy must never reach
   * the text fields.
   */
  it('keeps the description fields editable while a write is in flight', () => {
    renderModal(true);

    expect(screen.getByDisplayValue('BAILE DE DISFRACES')).toBeEnabled();
    expect(screen.getByDisplayValue('Paella')).toBeEnabled();
  });

  it('keeps the date fields editable while a write is in flight', () => {
    renderModal(true);

    expect(screen.getByLabelText('daysModal.rangeFrom')).toBeEnabled();
    expect(screen.getByLabelText('daysModal.rangeTo')).toBeEnabled();
    expect(screen.getByLabelText('daysModal.singleDate')).toBeEnabled();
  });

  it('blocks the submit buttons while a write is in flight, to stop a double add', () => {
    renderModal(true);

    expect(screen.getByRole('button', { name: 'daysModal.addRange' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'daysModal.addSingle' })).toBeDisabled();
  });

  it('asks for confirmation before deleting a day', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'daysModal.deleteDayAria' }));

    expect(handlers.onDeleteDay).not.toHaveBeenCalled();
    expect(screen.getByText('deleteDayDialog.title')).toBeInTheDocument();
  });
});
