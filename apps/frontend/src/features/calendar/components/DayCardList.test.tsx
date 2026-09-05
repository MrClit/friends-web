import { useState } from 'react';
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

/**
 * Which days are open is a prop now — CalendarPlanning owns it, since the toggle-all lives in its
 * header. This stands in for that owner so the cards can still be driven on their own.
 */
function ControlledList({ days }: { days: CalendarDay[] }) {
  const [openDays, setOpenDays] = useState<string[]>([]);

  return (
    <DayCardList
      days={days}
      participants={participants}
      totals={calendarTotals(days)}
      openDays={openDays}
      onOpenDaysChange={setOpenDays}
      onSetAttendance={onSetAttendance}
    />
  );
}

const renderList = (days = makeDays()) => render(<ControlledList days={days} />);

const closedDays = () => screen.queryAllByRole('button', { expanded: false });
const openDays = () => screen.queryAllByRole('button', { expanded: true });

describe('DayCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts every day collapsed, so the whole event fits on one phone screen', () => {
    renderList();

    expect(closedDays()).toHaveLength(2);
    expect(openDays()).toHaveLength(0);
  });

  it('tells what is being eaten and by how many while the day is collapsed', () => {
    renderList();

    // The summary lives in the header precisely so it survives collapsing: it is the answer somebody
    // opens this list to find, and collapsing by default is only acceptable because it is there.
    expect(screen.getByText('Paella')).toBeInTheDocument();
    expect(screen.getAllByText('grid.noPlan').length).toBeGreaterThan(0);
    expect(screen.getByText('grid.summary:2:3')).toBeInTheDocument();
  });

  it('keeps the inputs of a collapsed day out of the page', () => {
    renderList();

    // Radix unmounts a closed panel rather than hiding it, so those inputs are out of the accessibility
    // tree and out of the tab order too — which is the behaviour we want on a phone.
    expect(screen.queryAllByLabelText('grid.adultsAria')).toHaveLength(0);
  });

  it('expands a day without touching the others', () => {
    renderList();

    fireEvent.click(closedDays()[0]);

    expect(openDays()).toHaveLength(1);
    expect(closedDays()).toHaveLength(1);
    // Two sittings on the first day, two participants each.
    expect(screen.getAllByLabelText('grid.adultsAria')).toHaveLength(4);
  });

  it('collapses a day that was expanded', () => {
    renderList();

    fireEvent.click(closedDays()[0]);
    fireEvent.click(openDays()[0]);

    expect(closedDays()).toHaveLength(2);
    expect(screen.queryAllByLabelText('grid.adultsAria')).toHaveLength(0);
  });

  it('collapses a day added after the user expanded another one', () => {
    const { rerender } = renderList();

    fireEvent.click(closedDays()[0]);

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

    rerender(<ControlledList days={withExtraDay} />);

    // Tracking what is open rather than what is closed is what makes a brand new day arrive collapsed.
    expect(openDays()).toHaveLength(1);
    expect(closedDays()).toHaveLength(2);
  });
});
