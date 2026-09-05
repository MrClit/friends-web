import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { MdDinnerDining, MdLunchDining, MdRestaurant } from 'react-icons/md';
import type { CalendarDay, CalendarMeal, EventParticipantDto } from '@/api/types';
import { getParticipantName } from '@/features/events/utils/participants';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/components/ui';
import { formatDateLong } from '@/shared/utils/format';
import { AttendanceCell } from './AttendanceCell';
import { attendanceOf, type CalendarTotals } from '../utils/calendarTotals';

/**
 * An icon per sitting, and a plate for anything else. Deliberately partial: MEAL_SLOTS says the list can
 * grow — breakfast is the obvious next — and a new slot must render, not crash.
 *
 * Keyed off the type rather than the MealSlot enum: shared-types is consumed from a CommonJS dist, and
 * importing a runtime value out of it breaks the Rollup build, while the type costs nothing.
 */
const slotIcons: Partial<Record<CalendarMeal['slot'], IconType>> = {
  lunch: MdLunchDining,
  dinner: MdDinnerDining,
};

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
 * The plan and the headcounts live in the header rather than the panel, so they survive collapsing —
 * that summary is the whole reason the card can be closed at all, and every card starts closed. With ten
 * participants a fully expanded day runs to some twenty input rows, and four of those make the last day
 * unreachable without a long scroll.
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
                  {/* Both min-w-0 are load-bearing: a flex item will not shrink below its content, so
                      without them the plan pushes the counts off the card instead of truncating. */}
                  <dt className="flex min-w-0 items-baseline gap-1.5">
                    <span className="shrink-0 text-slate-500 dark:text-slate-400">{t(`slots.${meal.slot}`)}</span>
                    <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
                      {meal.description || t('grid.noPlan')}
                    </span>
                  </dt>
                  <dd className="ml-auto flex shrink-0 items-baseline gap-2 tabular-nums">
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
          const SlotIcon = slotIcons[meal.slot] ?? MdRestaurant;

          return (
            // A block of its own rather than a 1px rule: on a phone the two sittings have to be
            // tellable apart at a glance, and the inputs stay white against this ground.
            <section key={meal.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 mt-3 first:mt-0">
              <div className="mb-2">
                <div className="flex items-center gap-1.5">
                  <SlotIcon aria-hidden="true" className="shrink-0 text-base text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{slotLabel}</h4>
                </div>
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
