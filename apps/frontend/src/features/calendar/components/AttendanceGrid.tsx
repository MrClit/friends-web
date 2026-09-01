import { useTranslation } from 'react-i18next';
import type { CalendarDay, EventParticipantDto } from '@/api/types';
import { getParticipantName } from '@/features/events/utils/participants';
import { formatDateShort } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { AttendanceCell } from './AttendanceCell';
import { attendanceOf, type CalendarTotals } from '../utils/calendarTotals';

interface AttendanceGridProps {
  days: CalendarDay[];
  participants: EventParticipantDto[];
  totals: CalendarTotals;
  onSetAttendance: (mealId: string, participantId: string, next: { adults: number; children: number }) => void;
}

const headerCell = 'px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300';
const stickyFirstColumn = 'sticky left-0 z-10 bg-white dark:bg-slate-900';

/**
 * The Excel this feature replaces: participants down the side, days across the top, each split into its
 * sittings, and two numbers in every cell.
 *
 * Desktop only. The mobile tree is DayCardList, and the two are mutually exclusive rather than one
 * layout bending — a grid this wide has nothing useful to become on a phone.
 */
export function AttendanceGrid({ days, participants, totals, onSetAttendance }: AttendanceGridProps) {
  const { t } = useTranslation('calendar');

  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse text-sm">
        <caption className="sr-only">{t('grid.participant')}</caption>

        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            <th scope="col" rowSpan={2} className={cn(headerCell, stickyFirstColumn, 'text-left align-bottom')}>
              {t('grid.participant')}
            </th>
            {days.map((day) => (
              <th
                key={day.id}
                scope="colgroup"
                colSpan={day.meals.length}
                className={cn(headerCell, 'border-l border-slate-200 dark:border-slate-700 text-center')}
              >
                <span className="block whitespace-nowrap">{formatDateShort(day.date)}</span>
                {day.description ? (
                  <span className="block text-[11px] font-normal uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    {day.description}
                  </span>
                ) : null}
              </th>
            ))}
            <th scope="col" rowSpan={2} className={cn(headerCell, 'text-center align-bottom')}>
              {t('grid.total')}
            </th>
          </tr>
          <tr>
            {days.flatMap((day) =>
              day.meals.map((meal, index) => (
                <th
                  key={meal.id}
                  scope="col"
                  className={cn(
                    headerCell,
                    'text-center font-normal',
                    index === 0 && 'border-l border-slate-200 dark:border-slate-700',
                  )}
                >
                  <span className="block whitespace-nowrap font-semibold">{t(`slots.${meal.slot}`)}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {meal.description || t('grid.noPlan')}
                  </span>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    {t('grid.adultsShort')} / {t('grid.childrenShort')}
                  </span>
                </th>
              )),
            )}
          </tr>
        </thead>

        <tbody>
          {participants.map((participant) => {
            const participantName = getParticipantName(participant, t);

            return (
              <tr key={participant.id} className="border-t border-slate-200 dark:border-slate-800">
                <th
                  scope="row"
                  className={cn(
                    stickyFirstColumn,
                    'px-3 py-2 text-left text-sm font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap',
                  )}
                >
                  {participantName}
                </th>

                {days.flatMap((day) =>
                  day.meals.map((meal) => {
                    const cell = attendanceOf(meal, participant.id);
                    const context = {
                      participant: participantName,
                      slot: t(`slots.${meal.slot}`),
                      date: formatDateShort(day.date),
                    };

                    return (
                      <td key={meal.id} className="px-2 py-1.5">
                        <AttendanceCell
                          adults={cell.adults}
                          children={cell.children}
                          adultsLabel={t('grid.adultsAria', context)}
                          childrenLabel={t('grid.childrenAria', context)}
                          onCommit={(next) => onSetAttendance(meal.id, participant.id, next)}
                        />
                      </td>
                    );
                  }),
                )}

                <td className="px-3 py-2 text-center">
                  <span className="block text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {totals.byParticipant[participant.id]?.total ?? 0}
                  </span>
                  <span className="block text-[11px] whitespace-nowrap tabular-nums text-slate-500 dark:text-slate-400">
                    {totals.byParticipant[participant.id]?.adults ?? 0} {t('grid.adultsShort')} ·{' '}
                    {totals.byParticipant[participant.id]?.children ?? 0} {t('grid.childrenShort')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
          <tr>
            <th scope="row" className={cn(headerCell, stickyFirstColumn, 'text-left')}>
              {t('grid.total')}
            </th>
            {days.flatMap((day) =>
              day.meals.map((meal) => {
                const mealTotal = totals.byMeal[meal.id];

                return (
                  <td key={meal.id} className="px-2 py-2 text-center">
                    <span className="block text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {mealTotal?.total ?? 0}
                    </span>
                    {/* Carries the letters rather than a bare `3 / 3`: the totals row is read on its
                        own, away from the column heading, and the legend above the grid is what makes
                        the two initials mean something. */}
                    <span className="block text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      {mealTotal?.adults ?? 0} {t('grid.adultsShort')} · {mealTotal?.children ?? 0}{' '}
                      {t('grid.childrenShort')}
                    </span>
                  </td>
                );
              }),
            )}
            <td className="px-3 py-2 text-center">
              <span className="block text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {totals.overall.total}
              </span>
              <span className="block text-[11px] whitespace-nowrap tabular-nums text-slate-500 dark:text-slate-400">
                {totals.overall.adults} {t('grid.adultsShort')} · {totals.overall.children} {t('grid.childrenShort')}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
