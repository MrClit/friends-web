import { useTranslation } from 'react-i18next';
import { EventDetailHeader } from '@/features/events';
import { KPIBalanceBreakdown, KPIParticipantsList, KPIUserStatusSummary } from '../index';
import type { Event } from '@/features/events/types';
import type {
  KPIType,
  KPIParticipantItem,
  KPIBalanceBreakdownViewModel,
  KPIContributionStatusSummaryData,
  KPISelectableParticipant,
  KPIUserStatusSummaryData,
} from '../types';
import { getKPIConfig } from '../index';
import { KPIBoxDetail } from './KPIBoxDetail';
import { KPIContributionStatusSummary } from './KPIContributionStatusSummary';

interface KPIDetailContentProps {
  event: Event;
  kpi: KPIType;
  items: KPIParticipantItem[];
  kpiValue: number;
  kpiConfig: ReturnType<typeof getKPIConfig>;
  balanceBreakdownData?: KPIBalanceBreakdownViewModel;
  contributionStatusSummaryData?: KPIContributionStatusSummaryData;
  userStatusSummaryData?: KPIUserStatusSummaryData;
  userStatusSelectableParticipants: KPISelectableParticipant[];
  selectedUserStatusParticipantId?: string;
  isCurrentUserParticipant: boolean;
  onUserStatusParticipantChange: (participantId: string | undefined) => void;
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
  contributionStatusSummaryData,
  userStatusSummaryData,
  userStatusSelectableParticipants,
  selectedUserStatusParticipantId,
  isCurrentUserParticipant,
  onUserStatusParticipantChange,
  onBack,
}: KPIDetailContentProps) {
  const { t } = useTranslation('kpiDetail');

  return (
    <div>
      <EventDetailHeader eventTitle={event.title} eventStatus={event.status} onBack={onBack} />
      <KPIBoxDetail kpi={kpi} kpiValue={kpiValue} kpiConfig={kpiConfig} />

      {kpi === 'balance' && balanceBreakdownData ? (
        <KPIBalanceBreakdown data={balanceBreakdownData} />
      ) : kpi === 'userStatus' ? (
        <KPIUserStatusSummary
          data={userStatusSummaryData}
          selectableParticipants={userStatusSelectableParticipants}
          selectedParticipantId={selectedUserStatusParticipantId}
          isCurrentUserParticipant={isCurrentUserParticipant}
          onSelectParticipant={onUserStatusParticipantChange}
        />
      ) : (
        <div className="space-y-6">
          {kpi === 'contributionStatus' && contributionStatusSummaryData ? (
            <KPIContributionStatusSummary data={contributionStatusSummaryData} />
          ) : null}

          <KPIParticipantsList
            items={items}
            title={kpi === 'contributionStatus' ? t('contributionStatus.participantsSectionTitle') : t('participants')}
            kpiConfig={kpiConfig[kpi]}
          />
        </div>
      )}
    </div>
  );
}
