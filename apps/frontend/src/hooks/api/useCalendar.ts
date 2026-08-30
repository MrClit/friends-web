import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/api/calendar.api';
import { queryKeys } from './keys';
import type {
  AttendanceCell,
  CalendarDay,
  CreateCalendarDaysDto,
  UpdateCalendarDayDto,
  UpdateCalendarMealDto,
} from '@/api/types';
import { useDeletingStore } from '@/shared/store/useDeletingStore';
import { useToast } from '@/shared/hooks/useToast';
import { applyAttendanceToCalendar } from '@/features/calendar/utils/applyAttendanceToCalendar';

/**
 * Query hook for the meal calendar of an event.
 *
 * Unlike the shopping list, this does not poll. The list is ticked dozens of times from several phones
 * while walking a supermarket; the calendar is filled in once per person and then read, so the global
 * defaults in lib/queryClient.ts are the right ones and a timer would only burn battery.
 *
 * @param eventId - Event ID
 * @returns Query result with the days, loading state and error
 */
export function useEventCalendar(eventId: string) {
  const isDeleting = useDeletingStore((state) => state.isDeleting);

  return useQuery({
    queryKey: queryKeys.calendar.byEvent(eventId),
    queryFn: () => calendarApi.getByEvent(eventId),
    // Disabled while the event is being deleted, or this would keep querying a row that is going away.
    enabled: !!eventId && !isDeleting,
  });
}

/**
 * Mutation hook to add days to the calendar.
 * No success toast: the days appearing in the grid is the feedback.
 * @param eventId - Event ID
 * @returns Mutation object with mutate function and status
 */
export function useAddCalendarDays(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.calendar.byEvent(eventId),
    mutationFn: (dto: CreateCalendarDaysDto) => calendarApi.addDays(eventId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.byEvent(eventId) });
    },
    onError: () => {
      error('add_days_error', undefined, { ns: 'calendar' });
    },
  });
}

/**
 * Mutation hook to set or clear what a day is about.
 * @param eventId - Event ID the day belongs to
 * @returns Mutation object with mutate function and status
 */
export function useUpdateCalendarDay(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.calendar.byEvent(eventId),
    mutationFn: ({ dayId, dto }: { dayId: string; dto: UpdateCalendarDayDto }) => calendarApi.updateDay(dayId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.byEvent(eventId) });
    },
    onError: () => {
      error('update_day_error', undefined, { ns: 'calendar' });
    },
  });
}

/**
 * Mutation hook to delete a day along with its sittings and attendances.
 * @param eventId - Event ID the day belongs to
 * @returns Mutation object with mutate function and status
 */
export function useDeleteCalendarDay(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.calendar.byEvent(eventId),
    mutationFn: (dayId: string) => calendarApi.deleteDay(dayId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.byEvent(eventId) });
    },
    onError: () => {
      error('delete_day_error', undefined, { ns: 'calendar' });
    },
  });
}

/**
 * Mutation hook to set or clear the plan of one sitting.
 * @param eventId - Event ID the sitting belongs to
 * @returns Mutation object with mutate function and status
 */
export function useUpdateCalendarMeal(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.calendar.byEvent(eventId),
    mutationFn: ({ mealId, dto }: { mealId: string; dto: UpdateCalendarMealDto }) =>
      calendarApi.updateMeal(mealId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.byEvent(eventId) });
    },
    onError: () => {
      error('update_meal_error', undefined, { ns: 'calendar' });
    },
  });
}

/**
 * Mutation hook to write one cell of the planning grid.
 *
 * Optimistic, like the shopping list toggle and for the same reason: filling a row of the grid means
 * committing a cell every time focus moves, and a round-trip per cell makes the inputs feel like they
 * are fighting back. Everything else in this file follows the repo's invalidate-and-refetch model.
 *
 * @param eventId - Event ID the calendar belongs to
 * @returns Mutation object with mutate function and status
 */
export function useSetAttendance(eventId: string) {
  const { error } = useToast();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.calendar.byEvent(eventId);

  return useMutation({
    mutationKey: queryKey,
    mutationFn: ({ mealId, cell }: { mealId: string; cell: AttendanceCell }) => calendarApi.setAttendance(mealId, cell),
    onMutate: async ({ mealId, cell }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousCalendar = queryClient.getQueryData<CalendarDay[]>(queryKey);

      queryClient.setQueryData<CalendarDay[]>(queryKey, (days) =>
        days ? applyAttendanceToCalendar(days, mealId, cell) : days,
      );

      return { previousCalendar };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(queryKey, context.previousCalendar);
      }
      error('attendance_error', undefined, { ns: 'calendar' });
    },
    onSettled: () => {
      // Only the last mutation still in flight reconciles: otherwise the invalidation of an earlier
      // cell would refetch server state on top of a later cell's optimistic value.
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
