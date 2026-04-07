import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KPIDetailView } from '@/features/kpi';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { MainLayout } from './MainLayout';

const KPI_DETAIL_NAMESPACES = ['kpiDetail', 'common', 'transactions', 'events'] as const;

/**
 * KPI Detail Page
 * Router wrapper that extracts the event ID and KPI type, then delegates to KPIDetailView
 */
export function KPIDetail() {
  const { t } = useTranslation(KPI_DETAIL_NAMESPACES);
  const { id, kpi } = useParams<{ id: string; kpi: string }>();
  const isI18nReady = useI18nNamespacesReady(KPI_DETAIL_NAMESPACES);

  if (!isI18nReady) {
    return (
      <MainLayout>
        <div className="text-center mt-10">{t('loading', { ns: 'common' })}</div>
      </MainLayout>
    );
  }

  if (!id || !kpi) {
    return (
      <MainLayout>
        <div className="text-center mt-10">{t('notFound', { ns: 'kpiDetail' })}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <KPIDetailView eventId={id} kpi={kpi} />
    </MainLayout>
  );
}
