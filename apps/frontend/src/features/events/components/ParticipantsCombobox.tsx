import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { MdPersonAdd } from 'react-icons/md';
import { useUsers } from '@/hooks/api/useUsers';
import { cn } from '@/shared/utils/cn';
import Avatar from '@/shared/components/Avatar';
import type { EventParticipant } from '../types';

interface ParticipantsComboboxProps {
  onSelect: (participant: EventParticipant) => void;
  existingParticipants: EventParticipant[];
  inputValue: string;
  onInputChange: (value: string) => void;
}

export default function ParticipantsCombobox({
  onSelect,
  existingParticipants,
  inputValue,
  onInputChange,
}: ParticipantsComboboxProps) {
  const { t } = useTranslation();
  const { data: users = [], isLoading } = useUsers();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Filter out already added participants
  const availableUsers = useMemo(() => {
    const existingIds = new Set(existingParticipants.filter((p) => p.type === 'user').map((p) => p.id));
    return users.filter((user) => !existingIds.has(user.id));
  }, [users, existingParticipants]);

  // LOCAL SEARCH: Filter users by input (no API call)
  const filteredUsers = useMemo(() => {
    if (!inputValue.trim()) return availableUsers;

    const query = inputValue.toLowerCase();
    return availableUsers.filter(
      (user) => user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
    );
  }, [inputValue, availableUsers]);

  // Check if input is new user (not in list)
  const isNewUser = useMemo(() => {
    return (
      inputValue.trim().length > 0 && !filteredUsers.some((u) => u.name?.toLowerCase() === inputValue.toLowerCase())
    );
  }, [inputValue, filteredUsers]);

  // Total navigable options count
  const optionsCount = filteredUsers.length + (isNewUser ? 1 : 0);

  const handleSelectUser = useCallback(
    (user: (typeof users)[0]) => {
      onSelect({
        id: user.id,
        type: 'user',
        name: user.name || user.email,
        avatar: user.avatar,
      });
      onInputChange('');
      setOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelect, onInputChange],
  );

  const handleSelectNewUser = useCallback(() => {
    if (!inputValue.trim()) return;
    onSelect({
      id: crypto.randomUUID(),
      type: 'guest',
      name: inputValue.trim(),
    });
    onInputChange('');
    setOpen(false);
    setHighlightedIndex(-1);
  }, [inputValue, onSelect, onInputChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;

      const scrollIntoView = (index: number) => {
        if (index >= 0 && listRef.current) {
          listRef.current.querySelectorAll<HTMLButtonElement>('button')[index]?.scrollIntoView({ block: 'nearest' });
        }
      };

      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < optionsCount - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : optionsCount - 1;
          scrollIntoView(next);
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredUsers.length) {
          handleSelectUser(filteredUsers[highlightedIndex]);
        } else if (highlightedIndex === filteredUsers.length && isNewUser) {
          handleSelectNewUser();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
      }
    },
    [open, optionsCount, highlightedIndex, filteredUsers, isNewUser, handleSelectUser, handleSelectNewUser],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="relative flex-1">
        {/* Hidden input to prevent browser autocomplete suggestions */}
        <input
          type="password"
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'absolute', pointerEvents: 'none', opacity: 0, height: 0, width: 0 }}
        />

        <label htmlFor="participant-input" className="sr-only">
          {t('participantsInput.placeholder')}
        </label>
        <MdPersonAdd className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
        <Popover.Anchor asChild>
          <input
            id="participant-input"
            type="text"
            className="w-full pl-11 pr-5 py-3.5 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
            placeholder={t('participantsInput.placeholder')}
            name="no-autocomplete-participant"
            autoComplete="nope"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="off"
            value={inputValue}
            onChange={(e) => {
              onInputChange(e.target.value);
              setHighlightedIndex(-1);
              setOpen(true);
            }}
            onFocus={() => {
              if (inputValue.trim()) setOpen(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setOpen(false);
                setHighlightedIndex(-1);
              }, 150)
            }
            onKeyDown={handleKeyDown}
          />
        </Popover.Anchor>
      </div>

      <Popover.Content
        className="z-50 bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-lg shadow-lg"
        style={{ width: 'var(--radix-popover-anchor-width)' }}
        side="bottom"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={listRef} className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-slate-500">{t('common.loading')}</div>
          ) : filteredUsers.length === 0 && !isNewUser ? (
            <div className="p-3 text-sm text-slate-500">{t('participantsInput.noUsers')}</div>
          ) : (
            <>
              {/* Users list */}
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    highlightedIndex === index
                      ? 'bg-slate-100 dark:bg-emerald-900/30'
                      : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30',
                  )}
                >
                  <Avatar
                    avatar={user.avatar}
                    name={user.name || user.email}
                    className="w-8 h-8 rounded-full text-xs shrink-0"
                    fallbackClassName="flex items-center justify-center bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 font-bold"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{user.name || user.email}</p>
                    {user.name && <p className="text-xs text-slate-500 dark:text-emerald-400 truncate">{user.email}</p>}
                  </div>
                </button>
              ))}

              {/* New user option */}
              {isNewUser && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSelectNewUser}
                  onMouseEnter={() => setHighlightedIndex(filteredUsers.length)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-t border-slate-200 dark:border-emerald-800',
                    highlightedIndex === filteredUsers.length
                      ? 'bg-slate-100 dark:bg-emerald-900/30'
                      : 'hover:bg-slate-100 dark:hover:bg-emerald-900/30',
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    +
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{t('participantsInput.createNew')}</p>
                    <p className="text-xs text-slate-500 dark:text-emerald-400">{inputValue}</p>
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
