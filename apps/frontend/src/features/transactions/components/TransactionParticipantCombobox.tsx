import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { FaChevronDown } from 'react-icons/fa';
import type { EventParticipant } from '@/features/events/types';
import { getParticipantAvatar, getParticipantName } from '@/features/events/utils/participants';
import { Avatar } from '@/shared/components/Avatar';
import { ComboboxOptionItem } from '@/shared/components/ComboboxOptionItem';
import { POT_PARTICIPANT_ID } from '@/shared/constants/pot';
import { cn } from '@/shared/utils/cn';
import type { PaymentType } from '../types';
import { useTransactionParticipantCombobox } from '../hooks/useTransactionParticipantCombobox';

interface TransactionParticipantComboboxProps {
  participants: EventParticipant[];
  paymentType: PaymentType;
  value: string;
  onChange: (participantId: string) => void;
}

export function TransactionParticipantCombobox({
  participants,
  paymentType,
  value,
  onChange,
}: TransactionParticipantComboboxProps) {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const options = useMemo(() => {
    const participantOptions = participants
      .filter((participant) => participant.type !== 'pot')
      .map((participant) => ({
        id: participant.id,
        label: getParticipantName(participant, t),
        description: participant.type === 'user' ? participant.email : undefined,
        avatar: getParticipantAvatar(participant),
        isPot: false,
      }));

    const optionsWithPot =
      paymentType === 'expense'
        ? [
            {
              id: POT_PARTICIPANT_ID,
              label: t('transactionForm.potOption'),
              avatar: null,
              isPot: true,
            },
            ...participantOptions,
          ]
        : participantOptions;

    const dedupedById = Array.from(new Map(optionsWithPot.map((option) => [option.id, option])).values());

    if (value && !dedupedById.some((option) => option.id === value)) {
      dedupedById.push({
        id: value,
        label: t('transactionsList.unknownParticipant'),
        avatar: null,
        isPot: false,
      });
    }

    return dedupedById;
  }, [participants, paymentType, t, value]);

  const {
    open,
    handleOpenChange,
    listRef,
    searchValue,
    selectedOption,
    filteredOptions,
    highlightedIndex,
    setHighlightedIndex,
    handleSearchChange,
    handleTriggerKeyDown,
    handleSearchKeyDown,
    handleSelectOption,
  } = useTransactionParticipantCombobox({
    value,
    options,
    onChange,
  });

  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus();
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Avatar
            avatar={selectedOption?.avatar}
            name={selectedOption?.label}
            isPot={selectedOption?.isPot}
            className="w-7 h-7 rounded-full text-[10px] shrink-0"
            fallbackClassName={cn(
              'flex items-center justify-center font-bold',
              !selectedOption?.isPot && 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
            )}
          />
        </div>

        <Popover.Trigger asChild>
          <button
            type="button"
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-left font-medium"
            onKeyDown={handleTriggerKeyDown}
            aria-label={t(`transactionForm.participantLabel.${paymentType}`)}
          >
            <span
              className={cn(
                'block truncate',
                selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-emerald-700',
              )}
            >
              {selectedOption?.label ?? t('transactionForm.participantPlaceholder')}
            </span>
          </button>
        </Popover.Trigger>

        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <FaChevronDown className={cn('text-[14px] transition-transform', open && 'rotate-180')} />
        </div>
      </div>

      <Popover.Content
        className="z-50 bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-lg shadow-lg"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        side="bottom"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <div className="border-b border-slate-100 dark:border-emerald-900 p-2">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-emerald-800 bg-white dark:bg-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 text-sm"
            placeholder={t('transactionForm.searchParticipantPlaceholder')}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="off"
          />
        </div>

        <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">{t('transactionForm.noParticipantsFound')}</div>
          ) : (
            filteredOptions.map((option, index) => (
              <ComboboxOptionItem
                key={option.id}
                avatar={option.avatar}
                label={option.label}
                description={option.description}
                isPot={option.isPot}
                isHighlighted={highlightedIndex === index}
                onSelect={() => handleSelectOption(option)}
                onHover={() => setHighlightedIndex(index)}
              />
            ))
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
