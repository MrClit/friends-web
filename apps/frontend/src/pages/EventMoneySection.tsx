import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdFlag } from 'react-icons/md';
import { useAuth } from '@/features/auth/useAuth';
import { EventKPIGrid } from '@/features/events';
import { ContributionTargetsModal } from '@/features/events/components/ContributionTargetsModal';
import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventLayoutContext } from '@/features/events/hooks';
import { sumContributionTargets } from '@/features/events/utils/contributionTargets';
import { TransactionModal } from '@/features/transactions/components/TransactionModal';
import { TransactionsList } from '@/features/transactions/components/TransactionsList';
import { ActionButton, FAB_POSITION_CLASSES } from '@/shared/components/ActionButton';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';
import { cn } from '@/shared/utils/cn';
import { formatAmount } from '@/shared/utils/format';

const MONEY_SECTION_NAMESPACES = ['eventDetail', 'transactions', 'events', 'common'] as const;

/**
 * Money section of the event hub: KPIs and transactions.
 * The event is resolved by EventLayout and arrives through the outlet context.
 */
export function EventMoneySection() {
  const { event, kpis } = useEventLayoutContext();
  const { t } = useTranslation(MONEY_SECTION_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(MONEY_SECTION_NAMESPACES);
  const { user } = useAuth();
  const transactionModalStore = useTransactionModalStore();
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  if (!isI18nReady) {
    return <EventSectionSkeleton />;
  }

  const targetTotal = sumContributionTargets(event.participants);

  return (
    <>
      {/* Same subheader as the calendar and shopping sections: each section owns its own settings. */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {targetTotal > 0
            ? t('targets.summaryTotal', { amount: formatAmount(targetTotal) })
            : t('targets.summaryNone')}
        </p>

        <button
          type="button"
          onClick={() => setIsEditingTargets(true)}
          aria-label={t('targets.openAria')}
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
          <MdFlag className="text-lg" aria-hidden="true" />
          {t('targets.open')}
        </button>
      </div>

      <EventKPIGrid
        eventId={event.id}
        currentUserId={user?.id}
        participants={event.participants}
        potBalance={kpis?.potBalance ?? 0}
        totalContributions={kpis?.totalContributions ?? 0}
        totalExpenses={kpis?.totalExpenses ?? 0}
        participantPending={kpis?.participantPending ?? {}}
      />

      <TransactionsList event={event} />

      <ActionButton
        onClick={() => transactionModalStore.openModal(event)}
        actionLabel={t('addTransaction')}
        actionIcon={<MdAdd size={22} />}
        className={FAB_POSITION_CLASSES}
      />
      <TransactionModal />
      <ContributionTargetsModal
        open={isEditingTargets}
        eventId={event.id}
        participants={event.participants}
        totalExpenses={kpis?.totalExpenses ?? 0}
        onClose={() => setIsEditingTargets(false)}
      />
    </>
  );
}
