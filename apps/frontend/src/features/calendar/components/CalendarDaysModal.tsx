import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete } from 'react-icons/md';
import type { CalendarDay } from '@/api/types';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogCloseButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components';
import { formatDateLong } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { AddDaysForm } from './AddDaysForm';

interface CalendarDaysModalProps {
  open: boolean;
  days: CalendarDay[];
  isBusy: boolean;
  onClose: () => void;
  onAddDays: (dates: string[]) => void;
  onUpdateDay: (dayId: string, description: string | null) => void;
  onUpdateMeal: (mealId: string, description: string | null) => void;
  onDeleteDay: (dayId: string) => void;
}

const textFieldClasses = cn(
  'w-full h-9 px-3',
  'text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
  'border border-slate-300 dark:border-slate-700 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
);

/**
 * Everything that shapes the calendar rather than fills it in: which days exist, what each day is
 * about, and what the plan is for each sitting.
 *
 * It is a modal and not a page on purpose — this is done once at the start of an event, while the
 * planning grid behind it is what people come back to.
 *
 * Descriptions commit on blur, like the cells of the grid, so typing a plan is not one request per key.
 *
 * Those fields are never disabled while a write is in flight, and that is the point: tabbing out of one
 * commits it, and disabling the field that just took focus would drop focus to the body and throw the
 * user out of the form. `isBusy` reaches the buttons only.
 */
export function CalendarDaysModal({
  open,
  days,
  isBusy,
  onClose,
  onAddDays,
  onUpdateDay,
  onUpdateMeal,
  onDeleteDay,
}: CalendarDaysModalProps) {
  const { t } = useTranslation('calendar');
  const [dayToDelete, setDayToDelete] = useState<CalendarDay | null>(null);

  const handleConfirmDelete = () => {
    if (dayToDelete) onDeleteDay(dayToDelete.id);
    setDayToDelete(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="p-5 max-h-[85vh] overflow-y-auto">
          <DialogTitle>{t('daysModal.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('empty.message')}</DialogDescription>

          <div className="mt-4">
            <AddDaysForm disabled={isBusy} onAddDays={onAddDays} />
          </div>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('daysModal.existingTitle')}
            </h3>

            {days.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('daysModal.noDays')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {days.map((day) => (
                  <li key={day.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {formatDateLong(day.date)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDayToDelete(day)}
                        disabled={isBusy}
                        aria-label={t('daysModal.deleteDayAria', { date: formatDateLong(day.date) })}
                        className={cn(
                          'p-2 shrink-0',
                          'text-rose-600 dark:text-rose-400 rounded-lg',
                          'cursor-pointer transition-colors',
                          'enabled:hover:bg-rose-50 dark:enabled:hover:bg-rose-950',
                          'focus:outline-none focus:ring-2 focus:ring-rose-500',
                          'disabled:opacity-40 disabled:cursor-not-allowed',
                        )}
                      >
                        <MdDelete className="text-lg" aria-hidden="true" />
                      </button>
                    </div>

                    <label className="block mb-3">
                      <span className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {t('daysModal.dayDescriptionLabel')}
                      </span>
                      <input
                        type="text"
                        maxLength={255}
                        defaultValue={day.description ?? ''}
                        placeholder={t('daysModal.dayDescriptionPlaceholder')}
                        onBlur={(event) => {
                          const next = event.target.value.trim();
                          if (next !== (day.description ?? '')) onUpdateDay(day.id, next || null);
                        }}
                        className={textFieldClasses}
                      />
                    </label>

                    {day.meals.map((meal) => (
                      <label key={meal.id} className="block mb-2 last:mb-0">
                        <span className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {t('daysModal.mealDescriptionLabel', { slot: t(`slots.${meal.slot}`) })}
                        </span>
                        <input
                          type="text"
                          maxLength={255}
                          defaultValue={meal.description ?? ''}
                          placeholder={t('daysModal.mealDescriptionPlaceholder')}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next !== (meal.description ?? '')) onUpdateMeal(meal.id, next || null);
                          }}
                          className={textFieldClasses}
                        />
                      </label>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-5 flex justify-end">
            <DialogCloseButton onClick={onClose}>{t('daysModal.close')}</DialogCloseButton>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={dayToDelete !== null}
        title={t('deleteDayDialog.title')}
        message={t('deleteDayDialog.message', {
          date: dayToDelete ? formatDateLong(dayToDelete.date) : '',
        })}
        confirmText={t('deleteDayDialog.confirm')}
        cancelText={t('deleteDayDialog.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDayToDelete(null)}
      />
    </>
  );
}
