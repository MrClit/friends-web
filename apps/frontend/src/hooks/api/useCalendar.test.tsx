import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MealSlot } from '@friends/shared-types';
import type { AttendanceCell, CalendarDay } from '@/api/types';
import { attendanceOf } from '@/features/calendar/utils/calendarTotals';
import { queryKeys } from './keys';
import { useSetAttendance } from './useCalendar';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

const setAttendanceMock = vi.fn();
vi.mock('@/api/calendar.api', () => ({
  calendarApi: {
    getByEvent: vi.fn(),
    addDays: vi.fn(),
    updateDay: vi.fn(),
    deleteDay: vi.fn(),
    updateMeal: vi.fn(),
    setAttendance: (mealId: string, dto: unknown) => setAttendanceMock(mealId, dto) as Promise<AttendanceCell>,
  },
}));

const errorToast = vi.fn();
vi.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: errorToast, info: vi.fn() }),
}));

const EVENT_ID = 'event-1';
const queryKey = queryKeys.calendar.byEvent(EVENT_ID);

const makeCalendar = (): CalendarDay[] => [
  {
    id: 'day-1',
    eventId: EVENT_ID,
    date: '2026-09-12',
    description: null,
    meals: [
      {
        id: 'lunch-1',
        dayId: 'day-1',
        slot: MealSlot.LUNCH,
        description: null,
        attendances: [{ id: 'a1', mealId: 'lunch-1', participantId: 'gil', adults: 2, children: 3 }],
      },
    ],
  },
];

const renderSetAttendance = (initial: CalendarDay[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(queryKey, initial);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useSetAttendance(EVENT_ID), { wrapper });
  return { queryClient, result };
};

const readCell = (queryClient: QueryClient, participantId: string) => {
  const meal = queryClient.getQueryData<CalendarDay[]>(queryKey)?.[0].meals[0];
  return meal ? attendanceOf(meal, participantId) : undefined;
};

describe('useSetAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes the cell into the cache before the request resolves', async () => {
    let resolveSet: (value: AttendanceCell) => void = () => {};
    setAttendanceMock.mockReturnValue(
      new Promise<AttendanceCell>((resolve) => {
        resolveSet = resolve;
      }),
    );
    const { queryClient, result } = renderSetAttendance(makeCalendar());

    result.current.mutate({ mealId: 'lunch-1', cell: { participantId: 'gil', adults: 4, children: 1 } });

    await waitFor(() => {
      expect(readCell(queryClient, 'gil')).toEqual({ adults: 4, children: 1 });
    });

    resolveSet({ participantId: 'gil', adults: 4, children: 1 });
  });

  it('removes the cell optimistically when it goes back to zero', async () => {
    setAttendanceMock.mockResolvedValue({ participantId: 'gil', adults: 0, children: 0 });
    const { queryClient, result } = renderSetAttendance(makeCalendar());

    result.current.mutate({ mealId: 'lunch-1', cell: { participantId: 'gil', adults: 0, children: 0 } });

    await waitFor(() => {
      expect(queryClient.getQueryData<CalendarDay[]>(queryKey)?.[0].meals[0].attendances).toHaveLength(0);
    });
  });

  it('restores the previous value and warns when the request fails', async () => {
    setAttendanceMock.mockRejectedValue(new Error('network'));
    const { queryClient, result } = renderSetAttendance(makeCalendar());

    result.current.mutate({ mealId: 'lunch-1', cell: { participantId: 'gil', adults: 9, children: 9 } });

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalled();
    });
    expect(readCell(queryClient, 'gil')).toEqual({ adults: 2, children: 3 });
  });

  /**
   * The guard in onSettled. Filling a row means committing a cell every time focus moves, so two
   * writes overlap constantly; without it the first one to settle invalidates and refetches server
   * state on top of the second one's optimistic value, and the number the user just typed flickers back.
   */
  it('does not invalidate while another cell is still in flight', async () => {
    const resolvers: Array<(value: AttendanceCell) => void> = [];
    setAttendanceMock.mockImplementation(
      () =>
        new Promise<AttendanceCell>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const { queryClient, result } = renderSetAttendance(makeCalendar());
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({ mealId: 'lunch-1', cell: { participantId: 'gil', adults: 1, children: 0 } });
    result.current.mutate({ mealId: 'lunch-1', cell: { participantId: 'maria', adults: 2, children: 0 } });

    await waitFor(() => {
      expect(resolvers).toHaveLength(2);
    });

    resolvers[0]({ participantId: 'gil', adults: 1, children: 0 });
    await waitFor(() => {
      expect(readCell(queryClient, 'maria')).toEqual({ adults: 2, children: 0 });
    });
    expect(invalidateSpy).not.toHaveBeenCalled();

    resolvers[1]({ participantId: 'maria', adults: 2, children: 0 });
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
    });
  });
});
