import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCalendarMonth, MdUnfoldLess, MdUnfoldMore } from 'react-icons/md';
import type { Event } from '@/features/events/types';
import { ApiError } from '@/api/client';
import {
  useEventCalendar,
  useAddCalendarDays,
  useUpdateCalendarDay,
  useUpdateCalendarMeal,
  useDeleteCalendarDay,
  useSetAttendance,
} from '@/hooks/api/useCalendar';
import { ErrorState } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import { AttendanceGrid } from './AttendanceGrid';
import { DayCardList } from './DayCardList';
import { CalendarDaysModal } from './CalendarDaysModal';
import { calendarTotals } from '../utils/calendarTotals';

interface CalendarPlanningProps {
  event: Event;
}

/**
 * The calendar section: who is coming to each lunch and dinner of the event.
 *
 * The planning is the view; shaping the calendar lives behind the Configure days button. That button is
 * a labelled secondary in the header rather than a floating one — the primary action here is filling in
 * the grid, which happens inline, and a FAB would sit on top of a table that already scrolls both ways.
 */
export function CalendarPlanning({ event }: CalendarPlanningProps) {
  const { t } = useTranslation(['calendar', 'common']);
  const [isConfiguring, setIsConfiguring] = useState(false);

  // The cards start collapsed, so this starts empty. It lives here rather than in DayCardList because the
  // control that opens and closes every day belongs in this header, beside Configure days.
  const [openDayIds, setOpenDayIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useEventCalendar(event.id);
  const addDays = useAddCalendarDays(event.id);
  const updateDay = useUpdateCalendarDay(event.id);
  const updateMeal = useUpdateCalendarMeal(event.id);
  const deleteDay = useDeleteCalendarDay(event.id);
  const setAttendance = useSetAttendance(event.id);

  const days = useMemo(() => data ?? [], [data]);

  // The pot is a spending bucket, not a person: it never attends a meal, and the API rejects it.
  const participants = useMemo(
    () => event.participants.filter((participant) => participant.type !== 'pot'),
    [event.participants],
  );

  const totals = useMemo(() => calendarTotals(days), [days]);

  const handleSetAttendance = useCallback(
    (mealId: string, participantId: string, next: { adults: number; children: number }) => {
      setAttendance.mutate({ mealId, cell: { participantId, ...next } });
    },
    [setAttendance],
  );

  const allDaysOpen = days.length > 0 && days.every((day) => openDayIds.includes(day.id));

  const handleToggleAllDays = useCallback(
    () => setOpenDayIds(allDaysOpen ? [] : days.map((day) => day.id)),
    [allDaysOpen, days],
  );

  const handleAddDays = useCallback((dates: string[]) => addDays.mutate({ dates }), [addDays]);

  const handleUpdateDay = useCallback(
    (dayId: string, description: string | null) => updateDay.mutate({ dayId, dto: { description } }),
    [updateDay],
  );

  const handleUpdateMeal = useCallback(
    (mealId: string, description: string | null) => updateMeal.mutate({ mealId, dto: { description } }),
    [updateMeal],
  );

  const handleDeleteDay = useCallback((dayId: string) => deleteDay.mutate(dayId), [deleteDay]);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mb-8 text-center text-emerald-400 py-8">{t('loading', { ns: 'common' })}</div>
    );
  }

  if (error) {
    const isNotFoundOrNoAccess = error instanceof ApiError && error.status === 404;

    return (
      <ErrorState
        message={isNotFoundOrNoAccess ? t('notFoundOrNoAccess', { ns: 'common' }) : undefined}
        onRetry={isNotFoundOrNoAccess ? undefined : () => void refetch()}
      />
    );
  }

  const isBusy = addDays.isPending || updateDay.isPending || updateMeal.isPending || deleteDay.isPending;

  return (
    <section className="pb-24">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('dayCount', { count: days.length })}
          </p>

          {/* The grid abbreviates the two counts to one letter each to keep a column the width of its
              inputs, and this is the only place that says what they stand for. Desktop only: the cards
              spell both words out, so on a phone it would just be noise. */}
          {days.length > 0 ? (
            <p className="hidden md:block text-[11px] text-slate-400 dark:text-slate-500">{t('grid.legend')}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Expanding every card only means something where there are cards, so it rides with the mobile
              tree. Icon only, with the label as its accessible name: the two arrows are the Material
              idiom for expand-all, and each day header already carries its own chevron. No aria-expanded
              — that belongs to a control owning a single panel. The ring is focus-visible so it answers
              the keyboard and not a fingertip. */}
          {days.length > 0 ? (
            <button
              type="button"
              onClick={handleToggleAllDays}
              aria-label={t(allDaysOpen ? 'cards.collapseAll' : 'cards.expandAll')}
              title={t(allDaysOpen ? 'cards.collapseAll' : 'cards.expandAll')}
              className={cn(
                'md:hidden flex items-center justify-center shrink-0',
                'h-10 w-10',
                'text-emerald-700 dark:text-emerald-300',
                'rounded-xl',
                'cursor-pointer transition-colors',
                'hover:bg-emerald-50 dark:hover:bg-emerald-900',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              )}
            >
              {allDaysOpen ? (
                <MdUnfoldLess className="text-xl" aria-hidden="true" />
              ) : (
                <MdUnfoldMore className="text-xl" aria-hidden="true" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsConfiguring(true)}
            aria-label={t('configureDaysAria')}
            className={cn(
              'flex items-center gap-2 shrink-0',
              'h-10 px-3',
              'text-sm font-medium',
              'bg-white dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
              'border border-emerald-300 dark:border-emerald-800 rounded-xl shadow-sm',
              'cursor-pointer transition-colors',
              'hover:bg-emerald-50 dark:hover:bg-emerald-900',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500',
            )}
          >
            <MdCalendarMonth className="text-lg" aria-hidden="true" />
            {t('configureDays')}
          </button>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-300 py-10 px-6 text-center dark:border-emerald-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('empty.title')}</h2>
          <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">{t('empty.message')}</p>
          <button
            type="button"
            onClick={() => setIsConfiguring(true)}
            className={cn(
              'h-10 px-4',
              'text-sm font-medium text-white',
              'bg-emerald-600 rounded-lg',
              'cursor-pointer transition-colors hover:bg-emerald-700',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500',
            )}
          >
            {t('empty.action')}
          </button>
        </div>
      ) : (
        <>
          <AttendanceGrid
            days={days}
            participants={participants}
            totals={totals}
            onSetAttendance={handleSetAttendance}
          />
          <DayCardList
            days={days}
            participants={participants}
            totals={totals}
            openDays={openDayIds}
            onOpenDaysChange={setOpenDayIds}
            onSetAttendance={handleSetAttendance}
          />
        </>
      )}

      <CalendarDaysModal
        open={isConfiguring}
        days={days}
        isBusy={isBusy}
        onClose={() => setIsConfiguring(false)}
        onAddDays={handleAddDays}
        onUpdateDay={handleUpdateDay}
        onUpdateMeal={handleUpdateMeal}
        onDeleteDay={handleDeleteDay}
      />
    </section>
  );
}
