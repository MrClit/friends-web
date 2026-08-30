import { useTranslation } from 'react-i18next';
import type { CalendarDay, EventParticipantDto } from '@/api/types';
import { getParticipantName } from '@/features/events/utils/participants';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/components/ui';
import { formatDateLong } from '@/shared/utils/format';
import { AttendanceCell } from './AttendanceCell';
import { attendanceOf, type CalendarTotals } from '../utils/calendarTotals';

interface DayCardProps {
  day: CalendarDay;
  participants: EventParticipantDto[];
  totals: CalendarTotals;
  onSetAttendance: (mealId: string, participantId: string, next: { adults: number; children: number }) => void;
}

/**
 * One day on a phone: collapsed it answers "how many of us are eating on Saturday", expanded it lets
 * anyone fill the numbers in.
 *
 * The headcounts live in the header rather than the panel, so they survive collapsing — that summary is
 * the whole reason the card can be closed at all. With ten participants a fully expanded day runs to
 * some twenty input rows, and four of those make the last day unreachable without a long scroll.
 */
export function DayCard({ day, participants, totals, onSetAttendance }: DayCardProps) {
  const { t } = useTranslation('calendar');
  const formattedDate = formatDateLong(day.date);

  return (
    <AccordionItem value={day.id}>
      <AccordionTrigger>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{formattedDate}</h3>
          {day.description ? (
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {day.description}
            </p>
          ) : null}

          <dl className="mt-1.5 flex flex-col gap-0.5">
            {day.meals.map((meal) => {
              const mealTotal = totals.byMeal[meal.id];

              return (
                <div key={meal.id} className="flex items-baseline gap-2 text-xs">
                  <dt className="text-slate-500 dark:text-slate-400">{t(`slots.${meal.slot}`)}</dt>
                  <dd className="ml-auto flex items-baseline gap-2 tabular-nums">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{mealTotal?.total ?? 0}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('grid.summary', {
                        adults: mealTotal?.adults ?? 0,
                        children: mealTotal?.children ?? 0,
                      })}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pt-1">
        {day.meals.map((meal) => {
          const slotLabel = t(`slots.${meal.slot}`);

          return (
            <section
              key={meal.id}
              className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800 mt-3 first:mt-0"
            >
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{slotLabel}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{meal.description || t('grid.noPlan')}</p>
              </div>

              <ul className="flex flex-col gap-1.5">
                {/* The A / N heading is stated once per sitting; every input still carries its own
                    aria-label, since a column heading two rows up does not reach a screen reader. */}
                <li className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  <span className="sr-only">{t('grid.participant')}</span>
                  <span aria-hidden="true" className="ml-auto flex gap-1">
                    <span className="w-11 text-center">{t('grid.adultsShort')}</span>
                    <span className="w-11 text-center">{t('grid.childrenShort')}</span>
                  </span>
                </li>

                {participants.map((participant) => {
                  const participantName = getParticipantName(participant, t);
                  const cell = attendanceOf(meal, participant.id);
                  const context = { participant: participantName, slot: slotLabel, date: formattedDate };

                  return (
                    <li key={participant.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-slate-700 dark:text-slate-200">{participantName}</span>
                      <AttendanceCell
                        adults={cell.adults}
                        children={cell.children}
                        adultsLabel={t('grid.adultsAria', context)}
                        childrenLabel={t('grid.childrenAria', context)}
                        onCommit={(next) => onSetAttendance(meal.id, participant.id, next)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </AccordionContent>
    </AccordionItem>
  );
}
