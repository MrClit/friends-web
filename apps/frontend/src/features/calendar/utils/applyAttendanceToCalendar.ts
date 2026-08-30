import type { AttendanceCell, CalendarDay } from '@/api/types';

/**
 * Write one cell into a calendar, returning a new array.
 *
 * Mirrors what the API does to the database, which is what makes it usable as the optimistic update:
 * the row is updated if it exists, added if it does not, and removed when both counts reach zero. That
 * last part matters — storing an explicit `0 + 0` instead of dropping the row would leave the
 * optimistic value disagreeing with the payload that comes back on the next refetch.
 *
 * The id of a row created here is provisional; the refetch that follows replaces it with the real one.
 *
 * @param days - Current calendar
 * @param mealId - Sitting the cell belongs to
 * @param cell - Participant and their new counts
 * @returns A new calendar with that cell written
 */
export function applyAttendanceToCalendar(days: CalendarDay[], mealId: string, cell: AttendanceCell): CalendarDay[] {
  const isEmpty = cell.adults === 0 && cell.children === 0;

  return days.map((day) => {
    if (!day.meals?.some((meal) => meal.id === mealId)) return day;

    return {
      ...day,
      meals: day.meals.map((meal) => {
        if (meal.id !== mealId) return meal;

        const attendances = meal.attendances ?? [];
        const existing = attendances.find((attendance) => attendance.participantId === cell.participantId);

        if (isEmpty) {
          return {
            ...meal,
            attendances: attendances.filter((attendance) => attendance.participantId !== cell.participantId),
          };
        }

        if (existing) {
          return {
            ...meal,
            attendances: attendances.map((attendance) =>
              attendance.participantId === cell.participantId
                ? { ...attendance, adults: cell.adults, children: cell.children }
                : attendance,
            ),
          };
        }

        return {
          ...meal,
          attendances: [
            ...attendances,
            {
              id: `optimistic-${mealId}-${cell.participantId}`,
              mealId,
              participantId: cell.participantId,
              adults: cell.adults,
              children: cell.children,
            },
          ],
        };
      }),
    };
  });
}
