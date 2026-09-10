import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventLayoutContext } from '@/features/events/hooks';
import { KPIDetailView } from '@/features/kpi';
import { ErrorState } from '@/shared/components';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { describeLoadError } from '@/shared/utils/apiError';

const KPI_DETAIL_NAMESPACES = ['kpiDetail', 'common', 'transactions', 'events'] as const;

/**
 * KPI drill-down of an event. A detail route of the event layout: the event and
 * its loading, error and not-found states belong to the layout, so this page
 * only resolves the KPIs it cannot render without.
 */
export function KPIDetail() {
  const { t } = useTranslation(KPI_DETAIL_NAMESPACES);
  const { kpi } = useParams<{ kpi: string }>();
  const isI18nReady = useI18nNamespacesReady(KPI_DETAIL_NAMESPACES);
  const { event, kpis, isLoadingKpis, kpisError, refetchKpis } = useEventLayoutContext();

  if (!isI18nReady || isLoadingKpis) {
    return <EventSectionSkeleton />;
  }

  if (kpisError) {
    const { message, isRetryable } = describeLoadError(kpisError, t);

    return <ErrorState message={message} onRetry={isRetryable ? refetchKpis : undefined} />;
  }

  if (!kpi || !kpis) {
    return <div className="text-center mt-10">{t('notFound', { ns: 'kpiDetail' })}</div>;
  }

  return <KPIDetailView event={event} kpis={kpis} kpi={kpi} />;
}
