import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { MdWarningAmber } from 'react-icons/md';
import type { Group } from '@/api/groups.api';

interface EventGroupFieldProps {
  groups: Group[];
  groupId: string;
  /** Name to show when the group cannot be changed and is not in `groups` (e.g. the user left it). */
  groupName?: string;
  /** False while a non-admin edits an event: the group is shown but cannot be changed. */
  canChange: boolean;
  onChange: (groupId: string) => void;
  /** Users the last group change dropped from the form. */
  removedNames: string[];
}

const fieldClassName =
  'w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 font-medium text-slate-900 dark:text-white';

export function EventGroupField({
  groups,
  groupId,
  groupName,
  canChange,
  onChange,
  removedNames,
}: EventGroupFieldProps) {
  const { t } = useTranslation('events');
  const id = useId();
  const currentName = groups.find((group) => group.id === groupId)?.name ?? groupName ?? '';
  // A single group while creating is already chosen: there is nothing to pick.
  const showSelect = canChange && groups.length > 1;

  return (
    <div>
      <label htmlFor={id} className="block text-slate-700 dark:text-emerald-100 font-medium mb-2">
        {t('eventForm.groupLabel')}
      </label>
      {showSelect ? (
        <select
          id={id}
          className={`${fieldClassName} focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all`}
          value={groupId}
          onChange={(e) => onChange(e.target.value)}
          required
        >
          <option value="" disabled>
            {t('eventForm.groupPlaceholder')}
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input id={id} type="text" className={`${fieldClassName} opacity-80`} value={currentName} readOnly />
          {!canChange ? (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-emerald-300/70">{t('eventForm.groupReadOnlyHint')}</p>
          ) : null}
        </>
      )}
      {removedNames.length > 0 ? (
        <p
          role="status"
          className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <MdWarningAmber aria-hidden="true" className="mt-0.5 shrink-0 text-base" />
          {t('eventForm.removedByGroupChange', { names: removedNames.join(', ') })}
        </p>
      ) : null}
    </div>
  );
}
