import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { KPIType } from '../types';
import { isValidKPI, getKPIConfig, buildKPIItems } from '../index';

// React Query hooks
import { useEvent } from '../../../hooks/api/useEvents';
import { useEventKPIs } from '../../../hooks/api/useEventKPIs';

import KPIDetailContent from './KPIDetailContent.tsx';

/**
 * KPI Detail View Container
 * Handles all business logic: data fetching, validation, state management
 * Renders KPIDetailContent for presentation
 */
export default function KPIDetailView({ eventId, kpi: rawKpi }: { eventId: string; kpi: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // React Query hooks - MUST be called before any early returns
  const { data: event, isLoading: isLoadingEvent, error: eventError } = useEvent(eventId);
  const { data: kpis, isLoading: isLoadingKPIs } = useEventKPIs(eventId);

  // Validate KPI parameter early (after hooks)
  if (!rawKpi || !isValidKPI(rawKpi)) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  const kpi: KPIType = rawKpi;

  // Get KPI configuration
  const KPI_CONFIG = getKPIConfig(t);

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

  if (!event || !kpis) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  // Calculate KPI value using type-safe mapper
  const kpiValueMap: Record<KPIType, number> = {
    balance: kpis.potBalance,
    contributions: kpis.totalContributions,
    expenses: kpis.totalExpenses,
    pending: kpis.pendingToCompensate,
  };
  const kpiValue = kpiValueMap[kpi];

  // Build participants list from KPIs
  const participantsData = kpis[KPI_CONFIG[kpi].kpiKey];
  const items = buildKPIItems(participantsData, event, kpi, KPI_CONFIG, kpis.potExpenses, t);

  return (
    <KPIDetailContent
      event={event}
      kpi={kpi}
      items={items}
      kpiValue={kpiValue}
      kpiConfig={KPI_CONFIG}
      onBack={() => navigate(`/event/${event.id}`)}
    />
  );
}
