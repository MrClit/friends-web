import { useTranslation } from 'react-i18next';
import { EventDetailHeader } from '@/features/events';
import { KPIBalanceBreakdown, KPIParticipantsList } from '../index';
import type { Event } from '@/features/events/types';
import type { KPIType, KPIParticipantItem, KPIBalanceBreakdownViewModel } from '../types';
import { getKPIConfig } from '../index';
import { KPIBoxDetail } from './KPIBoxDetail';

interface KPIDetailContentProps {
  event: Event;
  kpi: KPIType;
  items: KPIParticipantItem[];
  kpiValue: number;
  kpiConfig: ReturnType<typeof getKPIConfig>;
  balanceBreakdownData?: KPIBalanceBreakdownViewModel;
  onBack: () => void;
}

/**
 * KPI Detail Content Presentational Component
 * Renders the KPI detail UI
 * All logic is handled by the container (KPIDetailView)
 */
export function KPIDetailContent({
  event,
  kpi,
  items,
  kpiValue,
  kpiConfig,
  balanceBreakdownData,
  onBack,
}: KPIDetailContentProps) {
  const { t } = useTranslation();

  return (
    <div>
      <EventDetailHeader eventId={event.id} eventTitle={event.title} onBack={onBack} />
      <KPIBoxDetail kpi={kpi} kpiValue={kpiValue} kpiConfig={kpiConfig} />

      {kpi === 'balance' && balanceBreakdownData ? (
        <KPIBalanceBreakdown data={balanceBreakdownData} />
      ) : (
        <KPIParticipantsList items={items} title={t('kpiDetail.participants')} kpiConfig={kpiConfig[kpi]} />
      )}
    </div>
  );
}
