import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../shared/utils/formatAmount';

// Import from features
import { EventDetailHeader } from '@/features/events';
import { KPIParticipantsList, KPIExplanation } from '@/features/kpi';
import type { KPIType } from '@/features/kpi';

import KPIBox from '../features/events/components/KPIBox';

// React Query hooks
import { useEvent } from '../hooks/api/useEvents';
import { useEventKPIs } from '../hooks/api/useEventKPIs';

export default function KPIDetail() {
  const { id, kpi } = useParams<{ id: string; kpi: KPIType }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // React Query hooks
  const { data: event, isLoading: isLoadingEvent, error: eventError } = useEvent(id!);
  const { kpis, isLoading: isLoadingKPIs } = useEventKPIs(id!);

  // Loading state
  if (isLoadingEvent || isLoadingKPIs) {
    return <div className="text-center mt-10">{t('common.loading')}</div>;
  }

  // Error state
  if (eventError) {
    return (
      <div className="text-center mt-10">
        {t('common.error')}: {eventError.message}
      </div>
    );
  }

  // KPI Configuration
  const KPI_CONFIG = {
    balance: {
      label: t('kpiDetail.kpi.balance'),
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      kpiKey: 'participantBalances' as const,
      includePot: false, // El bote no se lista en su propio balance
    },
    contributions: {
      label: t('kpiDetail.kpi.contributions'),
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      kpiKey: 'participantContributions' as const,
      includePot: false, // El bote no recibe contribuciones
    },
    expenses: {
      label: t('kpiDetail.kpi.expenses'),
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      kpiKey: 'participantExpenses' as const,
      includePot: true, // ⭐ EL BOTE PUEDE TENER GASTOS
    },
    pending: {
      label: t('kpiDetail.kpi.pending'),
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      kpiKey: 'participantPending' as const,
      includePot: false, // El bote no tiene pendientes
    },
  } as const;

  if (!event || !kpi) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  if (!kpis) {
    return <div className="text-center mt-10">{t('common.loading')}</div>;
  }

  // Validate KPI is in config
  if (!(kpi in KPI_CONFIG)) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  // Calculate KPI value
  let kpiValue = 0;
  if (kpi === 'balance') kpiValue = kpis.potBalance;
  if (kpi === 'contributions') kpiValue = kpis.totalContributions;
  if (kpi === 'expenses') kpiValue = kpis.totalExpenses;

  // Build participants list from KPIs
  const participantsData = kpis[KPI_CONFIG[kpi].kpiKey];
  const items = Object.entries(participantsData).map(([participantId, total]) => {
    const participant = event.participants.find((p) => p.id === participantId);
    return {
      id: participantId,
      name: participant?.name || participantId,
      value: formatAmount(total as number),
      isPot: false,
    };
  });

  // ⭐ Add Pot item if needed (only for expenses KPI)
  if (KPI_CONFIG[kpi].includePot && kpis.potExpenses > 0) {
    items.push({
      id: '0',
      name: t('transactionsList.potLabel'), // "El Bote"
      value: formatAmount(kpis.potExpenses),
      isPot: true,
    });
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
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
