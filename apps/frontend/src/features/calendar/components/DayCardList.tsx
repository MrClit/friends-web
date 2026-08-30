import { useCallback, useMemo, useState } from 'react';
import type { CalendarDay, EventParticipantDto } from '@/api/types';
import { Accordion } from '@/shared/components/ui';
import { DayCard } from './DayCard';
import type { CalendarTotals } from '../utils/calendarTotals';

interface DayCardListProps {
  days: CalendarDay[];
  participants: EventParticipantDto[];
  totals: CalendarTotals;
  onSetAttendance: (mealId: string, participantId: string, next: { adults: number; children: number }) => void;
}

/**
 * The mobile half of the section: one collapsible card per day instead of the grid.
 *
 * Mutually exclusive with AttendanceGrid through Tailwind alone, the same way AdminUsersTable swaps its
 * table for cards. There is no useMediaQuery in this app and this does not need one.
 */
export function DayCardList({ days, participants, totals, onSetAttendance }: DayCardListProps) {
  // What the user has *closed*, rather than what is open. Reading it that way means every day starts
  // expanded — the behaviour this list had before it could collapse at all — and a day added later
  // opens by default too, without an effect syncing state back to props.
  const [closedDays, setClosedDays] = useState<string[]>([]);

  const openDays = useMemo(
    () => days.filter((day) => !closedDays.includes(day.id)).map((day) => day.id),
    [days, closedDays],
  );

  const handleValueChange = useCallback(
    (nextOpen: string[]) => setClosedDays(days.filter((day) => !nextOpen.includes(day.id)).map((day) => day.id)),
    [days],
  );

  return (
    <Accordion
      type="multiple"
      value={openDays}
      onValueChange={handleValueChange}
      className="flex flex-col gap-3 md:hidden"
    >
      {days.map((day) => (
        <DayCard key={day.id} day={day} participants={participants} totals={totals} onSetAttendance={onSetAttendance} />
      ))}
    </Accordion>
  );
}
