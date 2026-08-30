import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MealSlot } from '@friends/shared-types';
import type { CalendarDay, EventParticipantDto } from '@/api/types';
import { DayCardList } from './DayCardList';
import { calendarTotals } from '../utils/calendarTotals';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { adults?: number; children?: number }) =>
        options?.adults !== undefined ? `${key}:${options.adults}:${options.children}` : key,
    }),
  };
});

const onSetAttendance = vi.fn();

const participants: EventParticipantDto[] = [
  { type: 'user', id: 'maria', name: 'María' },
  { type: 'guest', id: 'gil', name: 'Familia Gil' },
];

const makeDays = (): CalendarDay[] => [
  {
    id: 'day-1',
    eventId: 'event-1',
    date: '2026-09-12',
    description: 'BAILE DE DISFRACES',
    meals: [
      {
        id: 'lunch-1',
        dayId: 'day-1',
        slot: MealSlot.LUNCH,
        description: 'Paella',
        attendances: [{ id: 'a1', mealId: 'lunch-1', participantId: 'gil', adults: 2, children: 3 }],
      },
      { id: 'dinner-1', dayId: 'day-1', slot: MealSlot.DINNER, description: null, attendances: [] },
    ],
  },
  {
    id: 'day-2',
    eventId: 'event-1',
    date: '2026-09-13',
    description: null,
    meals: [{ id: 'lunch-2', dayId: 'day-2', slot: MealSlot.LUNCH, description: null, attendances: [] }],
  },
];

const renderList = (days = makeDays()) =>
  render(
    <DayCardList
      days={days}
      participants={participants}
      totals={calendarTotals(days)}
      onSetAttendance={onSetAttendance}
    />,
  );

const dayTriggers = () => screen.getAllByRole('button', { expanded: true });

describe('DayCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens every day by default, so nothing regresses for somebody filling the calendar in', () => {
    renderList();

    expect(dayTriggers()).toHaveLength(2);
  });

  it('collapses a day without touching the others', () => {
    renderList();

    fireEvent.click(dayTriggers()[0]);

    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(1);
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
  });

  it('keeps the headcounts readable while the day is collapsed', () => {
    renderList();

    fireEvent.click(dayTriggers()[0]);

    // The summary lives in the header precisely so it survives collapsing: it is the answer somebody
    // scrolls this list to find.
    expect(screen.getByText('grid.summary:2:3')).toBeInTheDocument();
  });

  it('takes the inputs of a collapsed day out of the page', () => {
    renderList();
    // Two sittings on the first day and one on the second, two participants each.
    expect(screen.getAllByLabelText('grid.adultsAria')).toHaveLength(6);

    fireEvent.click(dayTriggers()[0]);

    // Radix unmounts a closed panel rather than hiding it, so those four inputs are gone from the
    // accessibility tree and from the tab order too — which is the behaviour we want on a phone.
    // Nothing is lost by it: collapsing means clicking the header, and that blurs whatever cell was
    // focused, which is what commits its draft.
    expect(screen.getAllByLabelText('grid.adultsAria')).toHaveLength(2);
  });

  it('reopens a day that was collapsed', () => {
    renderList();

    const trigger = dayTriggers()[0];
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(dayTriggers()).toHaveLength(2);
  });

  it('opens a day added after the user collapsed another one', () => {
    const { rerender } = renderList();

    fireEvent.click(dayTriggers()[0]);

    const withExtraDay: CalendarDay[] = [
      ...makeDays(),
      {
        id: 'day-3',
        eventId: 'event-1',
        date: '2026-09-14',
        description: null,
        meals: [{ id: 'lunch-3', dayId: 'day-3', slot: MealSlot.LUNCH, description: null, attendances: [] }],
      },
    ];

    rerender(
      <DayCardList
        days={withExtraDay}
        participants={participants}
        totals={calendarTotals(withExtraDay)}
        onSetAttendance={onSetAttendance}
      />,
    );

    // Tracking what is closed rather than what is open is what makes a brand new day arrive expanded.
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(2);
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(1);
  });
});
