import { useTranslation } from 'react-i18next';
import { EventDetailHeader } from '@/features/events';
import { KPIParticipantsList, KPIExplanation } from '../index';
import KPIBox from '../../events/components/KPIBox';
import type { Event } from '@/api/types';
import type { KPIType, KPIParticipantItem } from '../types';
import { getKPIConfig } from '../index';

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
export default function KPIDetailContent({ event, kpi, items, kpiValue, kpiConfig, onBack }: KPIDetailContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <EventDetailHeader eventId={event.id} eventTitle={event.title} onBack={onBack} />

      <div className="w-full max-w-2xl mb-8">
        <KPIBox
          label={kpiConfig[kpi].label}
          value={kpiValue}
          colorClass={kpiConfig[kpi].colorClass + ' py-8'}
          labelClassName="!text-lg"
          valueClassName="!text-4xl"
        />
      </div>

      <KPIParticipantsList items={items} title={t('kpiDetail.participants')} />

      <KPIExplanation kpiType={kpi} />
    </div>
  );
}
