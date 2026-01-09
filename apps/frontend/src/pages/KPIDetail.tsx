import { useParams } from 'react-router-dom';
import { KPIDetailView } from '@/features/kpi';

/**
 * KPI Detail Page
 * Router wrapper that extracts the event ID and delegates to KPIDetailView
 */
export default function KPIDetail() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="text-center mt-10">Invalid event ID</div>;
  }

  return <KPIDetailView eventId={id} />;
}
