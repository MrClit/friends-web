import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { useAuth } from '@/features/auth/useAuth';
import { EventKPIGrid } from '@/features/events';
import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventLayoutContext } from '@/features/events/hooks';
import { TransactionModal } from '@/features/transactions/components/TransactionModal';
import { TransactionsList } from '@/features/transactions/components/TransactionsList';
import { ActionButton, FAB_POSITION_CLASSES } from '@/shared/components/ActionButton';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { useTransactionModalStore } from '@/shared/store/useTransactionModalStore';

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

  if (!isI18nReady) {
    return <EventSectionSkeleton />;
  }

  return (
    <>
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
    </>
  );
}
