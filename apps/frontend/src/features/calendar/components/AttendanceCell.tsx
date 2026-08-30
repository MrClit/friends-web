import { memo, useEffect, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { cn } from '@/shared/utils/cn';
import { MAX_ATTENDEES_PER_CELL } from '../constants';

interface AttendanceCellProps {
  adults: number;
  children: number;
  adultsLabel: string;
  childrenLabel: string;
  onCommit: (next: { adults: number; children: number }) => void;
}

const inputClasses = cn(
  'w-11 h-9 text-center',
  'text-sm tabular-nums',
  'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
  'border border-slate-300 dark:border-slate-700 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
  // The spinners steal half the width of a box this small, and the value is edited by typing anyway.
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
);

/**
 * One cell of the planning grid: how many adults and children a participant brings to a sitting.
 *
 * The value is committed on blur and on Enter, never on every keystroke — each commit is a request,
 * and typing "12" would otherwise send a 1 before the 2. The draft lives in local state until then,
 * which is also what lets the field be empty while being edited without that reading as a zero.
 */
export const AttendanceCell = memo(function AttendanceCell({
  adults,
  children,
  adultsLabel,
  childrenLabel,
  onCommit,
}: AttendanceCellProps) {
  const [draftAdults, setDraftAdults] = useState(String(adults));
  const [draftChildren, setDraftChildren] = useState(String(children));

  // The optimistic update, a refetch or somebody else's edit can all change the value under us while
  // this cell is mounted. Only follow it when the field is not being edited.
  useEffect(() => {
    setDraftAdults((draft) => (Number(draft) === adults ? draft : String(adults)));
  }, [adults]);

  useEffect(() => {
    setDraftChildren((draft) => (Number(draft) === children ? draft : String(children)));
  }, [children]);

  const commit = (nextAdults: string, nextChildren: string) => {
    const parsedAdults = toCount(nextAdults);
    const parsedChildren = toCount(nextChildren);

    setDraftAdults(String(parsedAdults));
    setDraftChildren(String(parsedChildren));

    if (parsedAdults === adults && parsedChildren === children) return;

    onCommit({ adults: parsedAdults, children: parsedChildren });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_ATTENDEES_PER_CELL}
        value={draftAdults}
        aria-label={adultsLabel}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftAdults(event.target.value)}
        onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
        onBlur={() => commit(draftAdults, draftChildren)}
        onKeyDown={handleKeyDown}
        className={inputClasses}
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_ATTENDEES_PER_CELL}
        value={draftChildren}
        aria-label={childrenLabel}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftChildren(event.target.value)}
        onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
        onBlur={() => commit(draftAdults, draftChildren)}
        onKeyDown={handleKeyDown}
        className={inputClasses}
      />
    </div>
  );
});

/** An empty field, a negative or anything unparseable all mean nobody: the cell is simply not filled in. */
function toCount(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) return 0;

  return Math.min(parsed, MAX_ATTENDEES_PER_CELL);
}
