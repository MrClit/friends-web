import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { MdPersonAdd } from 'react-icons/md';
import { cn } from '@/shared/utils/cn';
import { useParticipantsCombobox } from '../hooks/useParticipantsCombobox';
import { ComboboxUserOptionItem } from './ComboboxUserOptionItem';
import { ComboboxNewGuestItem } from './ComboboxNewGuestItem';
import type { EventParticipant } from '../types';

interface ParticipantsComboboxProps {
  onSelect: (participant: EventParticipant) => void;
  existingParticipants: EventParticipant[];
  inputValue: string;
  onInputChange: (value: string) => void;
  allowCreateGuest?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
}

export function ParticipantsCombobox({
  onSelect,
  existingParticipants,
  inputValue,
  onInputChange,
  allowCreateGuest = true,
  autoFocus = false,
  compact = false,
}: ParticipantsComboboxProps) {
  const { t } = useTranslation();
  const placeholder = allowCreateGuest ? t('participantsInput.placeholder') : t('participantsInput.replacePlaceholder');
  // Generate a unique name to prevent Chrome autocomplete history
  const inputName = useRef(`participant-${crypto.randomUUID()}`).current;
  const inputId = useRef(`participant-input-${crypto.randomUUID()}`).current;

  const {
    open,
    setOpen,
    listRef,
    isLoading,
    filteredUsers,
    isNewUser,
    highlightedIndex,
    setHighlightedIndex,
    handleSelectUser,
    handleSelectNewGuest,
    handleKeyDown,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
  } = useParticipantsCombobox({
    existingParticipants,
    inputValue,
    onInputChange,
    onSelect,
    allowCreateGuest,
  });

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
        <label htmlFor={inputId} className="sr-only">
          {placeholder}
        </label>
        <MdPersonAdd
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-slate-400',
            compact ? 'left-3 text-lg' : 'left-4 text-xl',
          )}
        />
        <Popover.Anchor asChild>
          <input
            id={inputId}
            type="text"
            className={cn(
              'w-full border bg-slate-50 font-medium text-slate-900',
              'outline-none transition-colors placeholder:text-slate-400',
              'focus:border-transparent focus:ring-2 focus:ring-primary',
              'dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-white dark:placeholder:text-emerald-700',
              compact ? 'rounded-xl py-2.5 pl-10 pr-4 text-sm' : 'rounded-2xl py-3.5 pl-11 pr-5',
            )}
            placeholder={placeholder}
            name={inputName}
            autoFocus={autoFocus}
            autoComplete="nope"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="off"
            onFocus={handleInputFocus}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
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
              {filteredUsers.map((user, index) => (
                <ComboboxUserOptionItem
                  key={user.id}
                  user={user}
                  isHighlighted={highlightedIndex === index}
                  onSelect={handleSelectUser}
                  onHover={() => setHighlightedIndex(index)}
                />
              ))}
              {isNewUser && (
                <ComboboxNewGuestItem
                  name={inputValue}
                  isHighlighted={highlightedIndex === filteredUsers.length}
                  onSelect={handleSelectNewGuest}
                  onHover={() => setHighlightedIndex(filteredUsers.length)}
                />
              )}
            </>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
