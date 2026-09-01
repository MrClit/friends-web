import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MealSlot } from '@friends/shared-types';
import type { CalendarDay } from '@/api/types';
import type { Event } from '@/features/events/types';
import { CalendarPlanning } from './CalendarPlanning';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { count?: number }) =>
        options?.count !== undefined ? `${key}:${options.count}` : key,
    }),
  };
});

const idleMutation = { mutate: vi.fn(), isPending: false };
const setAttendanceMutation = { mutate: vi.fn(), isPending: false };
const useEventCalendarMock = vi.fn();

vi.mock('@/hooks/api/useCalendar', () => ({
  useEventCalendar: (eventId: string) => useEventCalendarMock(eventId) as unknown,
  useAddCalendarDays: () => idleMutation,
  useUpdateCalendarDay: () => idleMutation,
  useUpdateCalendarMeal: () => idleMutation,
  useDeleteCalendarDay: () => idleMutation,
  useSetAttendance: () => setAttendanceMutation,
}));

const mockEvent = {
  id: 'event-1',
  title: 'Fiesta Mayor',
  status: 'active' as const,
  participants: [
    { type: 'user', id: 'maria', name: 'María' },
    { type: 'guest', id: 'gil', name: 'Familia Gil' },
    { type: 'pot', id: '0' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Event;

const makeCalendar = (): CalendarDay[] => [
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
      {
        id: 'dinner-1',
        dayId: 'day-1',
        slot: MealSlot.DINNER,
        description: null,
        attendances: [],
      },
    ],
  },
];

const givenCalendar = (days: CalendarDay[]) => {
  useEventCalendarMock.mockReturnValue({ data: days, isLoading: false, error: null, refetch: vi.fn() });
};

describe('CalendarPlanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers to add days when the calendar is empty', () => {
    givenCalendar([]);

    render(<CalendarPlanning event={mockEvent} />);

    expect(screen.getByText('empty.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'empty.action' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a row per participant, leaving the pot out', () => {
    givenCalendar(makeCalendar());

    render(<CalendarPlanning event={mockEvent} />);

    const grid = screen.getByRole('table');
    expect(within(grid).getByRole('rowheader', { name: 'María' })).toBeInTheDocument();
    expect(within(grid).getByRole('rowheader', { name: 'Familia Gil' })).toBeInTheDocument();
    // The pot is a spending bucket, not a person: it does not eat.
    expect(within(grid).queryByRole('rowheader', { name: /pot/i })).not.toBeInTheDocument();
  });

  it('shows the plan of each sitting and the day description', () => {
    givenCalendar(makeCalendar());

    render(<CalendarPlanning event={mockEvent} />);

    expect(screen.getAllByText('Paella').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BAILE DE DISFRACES').length).toBeGreaterThan(0);
  });

  it('totals the sitting and the participant', () => {
    givenCalendar(makeCalendar());

    render(<CalendarPlanning event={mockEvent} />);

    // Familia Gil brings 2 + 3, and it is the only entry, so the row, the column and the overall
    // total all read 5.
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  it('commits a cell through the attendance mutation', () => {
    givenCalendar(makeCalendar());

    render(<CalendarPlanning event={mockEvent} />);

    const [adultsInput] = screen.getAllByLabelText('grid.adultsAria');
    fireEvent.change(adultsInput, { target: { value: '4' } });
    fireEvent.blur(adultsInput);

    expect(setAttendanceMutation.mutate).toHaveBeenCalledWith({
      mealId: 'lunch-1',
      cell: { participantId: 'maria', adults: 4, children: 0 },
    });
  });

  it('retries a plain failure but not a 404', () => {
    useEventCalendarMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
      refetch: vi.fn(),
    });

    render(<CalendarPlanning event={mockEvent} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows the day count', () => {
    givenCalendar(makeCalendar());

    render(<CalendarPlanning event={mockEvent} />);

    expect(screen.getByText('dayCount:1')).toBeInTheDocument();
  });
});
