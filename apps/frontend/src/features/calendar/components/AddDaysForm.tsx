import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { expandDateRange } from '../utils/expandDateRange';
import { MAX_DAYS_PER_REQUEST } from '../constants';

interface AddDaysFormProps {
  /**
   * Blocks the submit buttons while a write is in flight, to stop a double click adding twice. It
   * deliberately does not reach the fields: see the note on focus below.
   */
  disabled?: boolean;
  onAddDays: (dates: string[]) => void;
}

const fieldClasses = cn(
  'w-full h-10 px-3',
  // A date input on iOS claims more width than it is given, and more still now that touch devices render
  // it at 16px. Two of these share a row from `sm` up, so pin the box to its container.
  'min-w-0 max-w-full box-border ios-date-input-fix',
  'text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
  'border border-slate-300 dark:border-slate-700 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
);

const buttonClasses = cn(
  'h-10 px-4 shrink-0',
  'text-sm font-medium',
  'bg-emerald-600 text-white rounded-lg',
  'cursor-pointer transition-colors',
  'enabled:hover:bg-emerald-700',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500',
  'disabled:opacity-40 disabled:cursor-not-allowed',
);

const labelClasses = 'block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300';

/**
 * Adding days, either as a range or one at a time.
 *
 * The range never reaches the API: it is expanded here into individual days, which is the only thing
 * the calendar stores. Re-sending days the event already has is harmless — the API ignores them — so
 * an overlapping range needs no special handling.
 *
 * Only the buttons go disabled while a write is in flight, never the fields. Disabling a focused input
 * drops focus to the body, so a pending mutation would throw the user out of the form mid-tab.
 */
export function AddDaysForm({ disabled, onAddDays }: AddDaysFormProps) {
  const { t } = useTranslation('calendar');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [single, setSingle] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleAddRange = () => {
    const dates = expandDateRange(from, to);

    if (dates.length === 0) {
      setRangeError(t('daysModal.invalidRange'));
      return;
    }

    // expandDateRange truncates rather than failing, so a range longer than the API accepts is worth
    // saying out loud instead of silently adding the first sixty days.
    if (dates.length === MAX_DAYS_PER_REQUEST) {
      setRangeError(t('daysModal.tooManyDays', { count: MAX_DAYS_PER_REQUEST }));
    } else {
      setRangeError(null);
    }

    onAddDays(dates);
    setFrom('');
    setTo('');
  };

  const handleAddSingle = () => {
    if (!single) return;

    onAddDays([single]);
    setSingle('');
  };

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{t('daysModal.addTitle')}</h3>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="calendar-range-from" className={labelClasses}>
            {t('daysModal.rangeFrom')}
          </label>
          <input
            id="calendar-range-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={fieldClasses}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="calendar-range-to" className={labelClasses}>
            {t('daysModal.rangeTo')}
          </label>
          <input
            id="calendar-range-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={fieldClasses}
          />
        </div>
        <button type="button" onClick={handleAddRange} disabled={disabled || !from || !to} className={buttonClasses}>
          {t('daysModal.addRange')}
        </button>
      </div>

      {rangeError ? (
        <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          {rangeError}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="calendar-single-date" className={labelClasses}>
            {t('daysModal.singleDate')}
          </label>
          <input
            id="calendar-single-date"
            type="date"
            value={single}
            onChange={(event) => setSingle(event.target.value)}
            className={fieldClasses}
          />
        </div>
        <button type="button" onClick={handleAddSingle} disabled={disabled || !single} className={buttonClasses}>
          {t('daysModal.addSingle')}
        </button>
      </div>
    </section>
  );
}
