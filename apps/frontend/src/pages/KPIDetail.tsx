import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventsStore } from '../features/events/store/useEventsStore';
import { useTransactionsStore } from '../features/transactions/store/useTransactionsStore';
import { formatAmount } from '../shared/utils/formatAmount';

// Import from features
import { EventDetailHeader } from '@/features/events';
import { KPIParticipantsList, KPIExplanation } from '@/features/kpi';
import type { KPIType } from '@/features/kpi';

import KPIBox from '../features/events/components/KPIBox';

export default function KPIDetail() {
  const { id, kpi } = useParams<{ id: string; kpi: KPIType }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const event = useEventsStore((state) => state.events.find((e) => e.id === id));

  // Store methods
  const getTotalExpensesByEvent = useTransactionsStore((state) => state.getTotalExpensesByEvent);
  const getTotalContributionsByEvent = useTransactionsStore((state) => state.getTotalContributionsByEvent);
  const getPotBalanceByEvent = useTransactionsStore((state) => state.getPotBalanceByEvent);
  const getPendingToCompensateByEvent = useTransactionsStore((state) => state.getPendingToCompensateByEvent);

  const getTotalExpensesByParticipant = useTransactionsStore((state) => state.getTotalExpensesByParticipant);
  const getTotalContributionsByParticipant = useTransactionsStore((state) => state.getTotalContributionsByParticipant);
  const getPendingToCompensateByParticipant = useTransactionsStore(
    (state) => state.getPendingToCompensateByParticipant,
  );
  const getBalanceByParticipant = useTransactionsStore((state) => state.getBalanceByParticipant);
  const getPotExpensesData = useTransactionsStore((state) => state.getPotExpensesData);

  // KPI Configuration
  const KPI_CONFIG = {
    balance: {
      label: t('kpiDetail.kpi.balance'),
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      participantFn: getBalanceByParticipant,
      includePot: false, // El bote no se lista en su propio balance
    },
    contributions: {
      label: t('kpiDetail.kpi.contributions'),
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      participantFn: getTotalContributionsByParticipant,
      includePot: false, // El bote no recibe contribuciones
    },
    expenses: {
      label: t('kpiDetail.kpi.expenses'),
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      participantFn: getTotalExpensesByParticipant,
      includePot: true, // ⭐ EL BOTE PUEDE TENER GASTOS
    },
    pending: {
      label: t('kpiDetail.kpi.pending'),
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      participantFn: getPendingToCompensateByParticipant,
      includePot: false, // El bote no tiene pendientes
    },
  } as const;

  if (!event || !kpi || !(kpi in KPI_CONFIG)) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  // Calculate KPI value
  const totalExpenses = getTotalExpensesByEvent(event.id);
  const totalContributions = getTotalContributionsByEvent(event.id);
  const potBalance = getPotBalanceByEvent(event.id);
  const pendingToCompensate = getPendingToCompensateByEvent(event.id);

  let kpiValue = 0;
  if (kpi === 'balance') kpiValue = potBalance;
  if (kpi === 'contributions') kpiValue = totalContributions;
  if (kpi === 'expenses') kpiValue = totalExpenses;
  if (kpi === 'pending') kpiValue = pendingToCompensate;

  // Build participants list
  const participantsData = KPI_CONFIG[kpi].participantFn(event);
  const items = participantsData.map((p) => ({
    id: p.participant.id,
    name: p.participant.name,
    value: formatAmount(p.total),
    isPot: false,
  }));

  // ⭐ Add Pot item if needed (only for expenses KPI)
  if (KPI_CONFIG[kpi].includePot) {
    const potData = getPotExpensesData(event.id);
    if (potData) {
      items.push({
        id: potData.participantId,
        name: t('transactionsList.potLabel'), // "El Bote"
        value: formatAmount(potData.total),
        isPot: true,
      });
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <EventDetailHeader eventId={event.id} eventTitle={event.title} onBack={() => navigate(`/event/${event.id}`)} />

      <div className="w-full max-w-2xl mb-8">
        <KPIBox
          label={KPI_CONFIG[kpi].label}
          value={kpiValue}
          colorClass={KPI_CONFIG[kpi].colorClass + ' py-8'}
          labelClassName="!text-lg"
          valueClassName="!text-4xl"
        />
      </div>

      <KPIParticipantsList items={items} title={t('kpiDetail.participants')} />

      <KPIExplanation kpiType={kpi} />
    </div>
  );
}
