import type { CalendarDay } from '@/api/types';

/** Adults, children and their sum. The sum is carried so the UI never re-adds it in three places. */
export interface AttendanceTotal {
  adults: number;
  children: number;
  total: number;
}

export interface CalendarTotals {
  /** Total per sitting, keyed by meal id: the totals row under each column of the grid. */
  byMeal: Record<string, AttendanceTotal>;
  /** Total per participant across the whole calendar: the totals column on the right. */
  byParticipant: Record<string, AttendanceTotal>;
  /** Everyone, everywhere. Useful as a headline figure. */
  overall: AttendanceTotal;
}

const emptyTotal = (): AttendanceTotal => ({ adults: 0, children: 0, total: 0 });

/**
 * Derive every total the planning view shows from the calendar payload.
 *
 * The API deliberately returns no aggregates: it already hands over the whole calendar, and computing
 * them here keeps the totals consistent with the optimistic value of a cell that has not been
 * acknowledged yet — a server-side total would lag behind the number the user just typed.
 *
 * Counts are plain integers, so ordinary addition is correct here. This is not money.
 *
 * @param days - The calendar as returned by the API
 * @returns Totals by meal, by participant, and overall
 */
export function calendarTotals(days: CalendarDay[]): CalendarTotals {
  const byMeal: Record<string, AttendanceTotal> = {};
  const byParticipant: Record<string, AttendanceTotal> = {};
  const overall = emptyTotal();

  for (const day of days) {
    for (const meal of day.meals ?? []) {
      const mealTotal = (byMeal[meal.id] ??= emptyTotal());

      for (const attendance of meal.attendances ?? []) {
        const participantTotal = (byParticipant[attendance.participantId] ??= emptyTotal());
        const headcount = attendance.adults + attendance.children;

        mealTotal.adults += attendance.adults;
        mealTotal.children += attendance.children;
        mealTotal.total += headcount;

        participantTotal.adults += attendance.adults;
        participantTotal.children += attendance.children;
        participantTotal.total += headcount;

        overall.adults += attendance.adults;
        overall.children += attendance.children;
        overall.total += headcount;
      }
    }
  }

  return { byMeal, byParticipant, overall };
}

/**
 * The cell of one participant on one sitting. Absent means nobody filled it in, which reads as zero.
 *
 * @param meal - The sitting to look in
 * @param participantId - Participant whose cell is wanted
 * @returns The stored counts, or zeros
 */
export function attendanceOf(
  meal: Pick<CalendarDay['meals'][number], 'attendances'>,
  participantId: string,
): { adults: number; children: number } {
  const found = (meal.attendances ?? []).find((attendance) => attendance.participantId === participantId);

  return { adults: found?.adults ?? 0, children: found?.children ?? 0 };
}
