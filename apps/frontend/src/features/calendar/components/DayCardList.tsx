import type { CalendarDay, EventParticipantDto } from '@/api/types';
import { Accordion } from '@/shared/components/ui';
import { DayCard } from './DayCard';
import type { CalendarTotals } from '../utils/calendarTotals';

interface DayCardListProps {
  days: CalendarDay[];
  participants: EventParticipantDto[];
  totals: CalendarTotals;
  /** Ids of the days currently expanded. Owned by CalendarPlanning, which also renders the toggle-all. */
  openDays: string[];
  onOpenDaysChange: (next: string[]) => void;
  onSetAttendance: (mealId: string, participantId: string, next: { adults: number; children: number }) => void;
}

/**
 * The mobile half of the section: one collapsible card per day instead of the grid.
 *
 * Mutually exclusive with AttendanceGrid through Tailwind alone, the same way AdminUsersTable swaps its
 * table for cards. There is no useMediaQuery in this app and this does not need one.
 *
 * Which days are open is a prop rather than local state: the control that opens and closes all of them
 * sits in the section header, next to Configure days, which is a different tree. Starting empty is what
 * makes every day arrive collapsed — with several participants an open day runs to some twenty input
 * rows — and what makes a day added later arrive collapsed too. Collapsed is only readable because the
 * card header already summarises each sitting's plan.
 */
export function DayCardList({
  days,
  participants,
  totals,
  openDays,
  onOpenDaysChange,
  onSetAttendance,
}: DayCardListProps) {
  return (
    <Accordion
      type="multiple"
      value={openDays}
      onValueChange={onOpenDaysChange}
      className="flex flex-col gap-3 md:hidden"
    >
      {days.map((day) => (
        <DayCard key={day.id} day={day} participants={participants} totals={totals} onSetAttendance={onSetAttendance} />
      ))}
    </Accordion>
  );
}
