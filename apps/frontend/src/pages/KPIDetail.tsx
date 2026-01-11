import { useParams } from 'react-router-dom';
import { KPIDetailView } from '@/features/kpi';

/**
 * KPI Detail Page
 * Router wrapper that extracts the event ID and KPI type, then delegates to KPIDetailView
 */
export default function KPIDetail() {
  const { id, kpi } = useParams<{ id: string; kpi: string }>();

  if (!id || !kpi) {
    return <div className="text-center mt-10">Invalid event ID or KPI type</div>;
  }

  return <KPIDetailView eventId={id} kpi={kpi} />;
}
