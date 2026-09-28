import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { MdPersonAdd } from 'react-icons/md';

import type { User } from '@/features/auth/types';
import { ComboboxOptionItem } from '@/shared/components/ComboboxOptionItem';
import { cn } from '@/shared/utils';

interface AdminGroupMemberPickerProps {
  /** Every user; the ones already in the group are left out here. */
  users: User[];
  memberIds: ReadonlySet<string>;
  disabled?: boolean;
  onAdd: (userId: string) => void;
}

/**
 * A button that opens a searchable list of the users who are not yet in the group. Picking one adds them.
 */
export function AdminGroupMemberPicker({ users, memberIds, disabled = false, onAdd }: AdminGroupMemberPickerProps) {
  const { t } = useTranslation('adminGroups');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [rawHighlightedIndex, setHighlightedIndex] = useState(-1);

  const candidates = useMemo(() => users.filter((user) => !memberIds.has(user.id)), [users, memberIds]);

  const filteredCandidates = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return candidates;
    }
    return candidates.filter(
      (user) => (user.name ?? '').toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    );
  }, [candidates, searchValue]);

  const optionsCount = filteredCandidates.length;
  // The list shrinks as members are added, so the index in use is clamped rather than corrected in an effect.
  const highlightedIndex = Math.min(rawHighlightedIndex, optionsCount - 1);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    setSearchValue('');
    setHighlightedIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (user: User) => {
      onAdd(user.id);
      handleOpenChange(false);
    },
    [handleOpenChange, onAdd],
  );

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (optionsCount === 0) return;
      setHighlightedIndex(highlightedIndex < optionsCount - 1 ? highlightedIndex + 1 : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (optionsCount === 0) return;
      setHighlightedIndex(highlightedIndex > 0 ? highlightedIndex - 1 : optionsCount - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(filteredCandidates[highlightedIndex]);
      } else if (optionsCount === 1) {
        handleSelect(filteredCandidates[0]);
      }
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2',
            'text-sm font-semibold text-white',
            'bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-emerald-500 dark:hover:bg-emerald-400',
          )}
        >
          <MdPersonAdd size={18} aria-hidden />
          {t('detail.addLabel')}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              ref={searchInputRef}
              type="text"
              className={cn(
                'w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
                'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30',
                'dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500',
              )}
              placeholder={t('detail.searchPlaceholder')}
              aria-label={t('detail.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleSearchKeyDown}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="off"
            />
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {optionsCount === 0 ? (
              <div className="p-3 text-sm text-slate-500 dark:text-slate-300">{t('detail.noUsersFound')}</div>
            ) : (
              filteredCandidates.map((user, index) => (
                <ComboboxOptionItem
                  key={user.id}
                  avatar={user.avatar}
                  label={user.name || user.email}
                  description={user.name ? user.email : undefined}
                  isHighlighted={highlightedIndex === index}
                  onSelect={() => handleSelect(user)}
                  onHover={() => setHighlightedIndex(index)}
                />
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
