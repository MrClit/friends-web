import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { FaChevronDown } from 'react-icons/fa';
import { Avatar } from '@/shared/components/Avatar';
import { ComboboxOptionItem } from '@/shared/components/ComboboxOptionItem';
import { cn } from '@/shared/utils/cn';
import { formatAmount } from '@/shared/utils/format';
import type { KPISelectableParticipant, KPIUserStatusSummaryData } from '../types';

interface KPIUserStatusSummaryProps {
  data?: KPIUserStatusSummaryData;
  selectableParticipants: KPISelectableParticipant[];
  selectedParticipantId?: string;
  isCurrentUserParticipant: boolean;
  onSelectParticipant: (participantId: string | undefined) => void;
}

interface UserStatusParticipantOption {
  id: string;
  label: string;
  description?: string;
  avatar?: string | null;
}

function formatPercent(value?: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return '--';
  }

  return `${value.toFixed(1)}%`;
}

function formatSignedAmount(value: number) {
  if (value === 0) {
    return formatAmount(0);
  }

  const sign = value > 0 ? '+' : '-';
  return `${sign}${formatAmount(Math.abs(value))}`;
}

interface SummaryMetricCardProps {
  label: string;
  value: string;
}

function SummaryMetricCard({ label, value }: SummaryMetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function KPIUserStatusSummary({
  data,
  selectableParticipants,
  selectedParticipantId,
  isCurrentUserParticipant,
  onSelectParticipant,
}: KPIUserStatusSummaryProps) {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchValue, setSearchValue] = useState('');

  const options = useMemo<UserStatusParticipantOption[]>(
    () =>
      selectableParticipants.map((participant) => ({
        id: participant.id,
        label: participant.name,
        avatar: null,
      })),
    [selectableParticipants],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedParticipantId),
    [options, selectedParticipantId],
  );

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const description = option.description?.toLowerCase() ?? '';
      return label.includes(query) || description.includes(query);
    });
  }, [options, searchValue]);

  const optionsCount = filteredOptions.length;

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
    setSearchValue('');
  }, []);

  const openPopover = useCallback(() => {
    setOpen(true);
    setHighlightedIndex(-1);
    setSearchValue('');
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openPopover();
        return;
      }

      close();
    },
    [close, openPopover],
  );

  const handleSelectOption = useCallback(
    (option: UserStatusParticipantOption) => {
      onSelectParticipant(option.id);
      close();
    },
    [close, onSelectParticipant],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setHighlightedIndex(-1);
  }, []);

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (open) return;

      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPopover();

        if (optionsCount > 0) {
          setHighlightedIndex(0);
        }
      }
    },
    [open, openPopover, optionsCount],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();

        if (optionsCount === 0) return;

        setHighlightedIndex((prev) => (prev < optionsCount - 1 ? prev + 1 : 0));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();

        if (optionsCount === 0) return;

        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : optionsCount - 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();

        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (filteredOptions.length === 1) {
          handleSelectOption(filteredOptions[0]);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    },
    [close, filteredOptions, handleSelectOption, highlightedIndex, optionsCount],
  );

  useEffect(() => {
    if (highlightedIndex < filteredOptions.length) return;

    setHighlightedIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : -1);
  }, [filteredOptions, highlightedIndex]);

  const hasTargets = (data?.targetTotal ?? 0) > 0;
  const hasSelectedParticipant = Boolean(selectedParticipantId);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('kpiDetail.userStatus.summaryTitle')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('kpiDetail.userStatus.selectorHint')}</p>
        </div>

        <div className="w-full sm:w-72">
          <label
            htmlFor="kpi-user-participant"
            className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            {t('kpiDetail.userStatus.selectorLabel')}
          </label>
          <Popover.Root open={open} onOpenChange={handleOpenChange}>
            <div className="relative group">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Avatar
                  avatar={selectedOption?.avatar}
                  name={selectedOption?.label}
                  className="w-7 h-7 rounded-full text-[10px] shrink-0"
                  fallbackClassName={cn(
                    'flex items-center justify-center font-bold',
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200',
                  )}
                />
              </div>

              <Popover.Trigger asChild>
                <button
                  id="kpi-user-participant"
                  type="button"
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 pl-12 pr-10 text-left text-sm font-medium outline-none',
                    'border-slate-200 bg-white text-slate-900',
                    'transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30',
                    'dark:border-slate-600 dark:bg-slate-900 dark:text-white',
                  )}
                  onKeyDown={handleTriggerKeyDown}
                  aria-label={t('kpiDetail.userStatus.selectorLabel')}
                >
                  <span
                    className={cn(
                      'block truncate',
                      hasSelectedParticipant ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {selectedOption?.label ?? t('kpiDetail.userStatus.selectorPlaceholder')}
                  </span>
                </button>
              </Popover.Trigger>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <FaChevronDown className={cn('text-[12px] transition-transform', open && 'rotate-180')} />
              </div>
            </div>

            <Popover.Content
              className="z-50 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
              style={{ width: 'var(--radix-popover-trigger-width)' }}
              side="bottom"
              align="start"
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
                    'w-full rounded-xl border px-3 py-2 text-base outline-none transition-colors sm:text-sm',
                    'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
                    'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30',
                    'dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500',
                  )}
                  placeholder={t('kpiDetail.userStatus.searchParticipantPlaceholder')}
                  value={searchValue}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoCapitalize="off"
                />
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 dark:text-slate-300">
                    {t('kpiDetail.userStatus.noParticipantsFound')}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <ComboboxOptionItem
                      key={option.id}
                      avatar={option.avatar}
                      label={option.label}
                      description={option.description}
                      isHighlighted={highlightedIndex === index}
                      onSelect={() => handleSelectOption(option)}
                      onHover={() => setHighlightedIndex(index)}
                    />
                  ))
                )}
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>

      {data ? (
        <>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{data.participantName}</p>
            {data.isCurrentUser && (
              <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 text-xs font-semibold">
                {t('kpiDetail.userStatus.youBadge')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SummaryMetricCard
              label={t('kpiDetail.userStatus.complianceLabel')}
              value={hasTargets ? formatPercent(data.compliancePercent) : t('kpiDetail.userStatus.noTargetValue')}
            />
            <SummaryMetricCard
              label={t('kpiDetail.userStatus.adjustmentPendingLabel')}
              value={formatAmount(data.adjustmentPending)}
            />
            <SummaryMetricCard label={t('kpiDetail.userStatus.netTotalLabel')} value={formatAmount(data.netTotal)} />
            <SummaryMetricCard
              label={t('kpiDetail.userStatus.targetTotalLabel')}
              value={formatAmount(data.targetTotal)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('kpiDetail.userStatus.differenceLabel')}
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {formatSignedAmount(data.differenceTotal)}
            </p>
          </div>

          {!hasTargets && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiDetail.userStatus.noTargetHint')}</p>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
          {isCurrentUserParticipant ? t('kpiDetail.userStatus.noSelection') : t('kpiDetail.userStatus.noParticipation')}
        </div>
      )}
    </section>
  );
}
