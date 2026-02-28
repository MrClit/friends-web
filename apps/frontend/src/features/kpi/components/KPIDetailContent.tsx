import { useTranslation } from 'react-i18next';
import { EventDetailHeader } from '@/features/events';
import { KPIParticipantsList } from '../index';
import type { Event } from '@/features/events/types';
import type { KPIType, KPIParticipantItem } from '../types';
import { getKPIConfig } from '../index';
import { KPIBoxDetail } from './KPIBoxDetail';

interface KPIDetailContentProps {
  event: Event;
  kpi: KPIType;
  items: KPIParticipantItem[];
  kpiValue: number;
  kpiConfig: ReturnType<typeof getKPIConfig>;
  onBack: () => void;
}

/**
 * KPI Detail Content Presentational Component
 * Renders the KPI detail UI
 * All logic is handled by the container (KPIDetailView)
 */
export function KPIDetailContent({ event, kpi, items, kpiValue, kpiConfig, onBack }: KPIDetailContentProps) {
  const { t } = useTranslation();

  return (
    <div>
      <EventDetailHeader eventId={event.id} eventTitle={event.title} onBack={onBack} />
      <KPIBoxDetail kpi={kpi} kpiValue={kpiValue} kpiConfig={kpiConfig} />
      <KPIParticipantsList items={items} title={t('kpiDetail.participants')} kpiConfig={kpiConfig[kpi]} />
    </div>
  );
}
