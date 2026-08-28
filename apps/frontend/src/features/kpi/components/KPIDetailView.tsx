import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EventKPIs } from '@/api/types';
import { useAuth } from '@/features/auth/useAuth';
import type { Event } from '@/features/events/types';
import type {
  KPIType,
  KPIParticipantItem,
  KPIContributionStatusSummaryData,
  KPISelectableParticipant,
  KPIUserStatusSummaryData,
} from '../types';
import {
  isValidKPI,
  getKPIConfig,
  buildBalanceBreakdownData,
  buildKPIItems,
  buildUserStatusSelectableParticipants,
  resolveUserStatusParticipantId,
  buildUserStatusSummaryData,
} from '../index';

import { KPIDetailContent } from './KPIDetailContent.tsx';

interface KPIDetailViewProps {
  event: Event;
  kpis: EventKPIs;
  kpi: string;
}

/**
 * KPI Detail View Container
 * Handles the KPI-specific logic: URL validation, participant selection and
 * the derived view models. The event and its KPIs come loaded from the layout.
 */
export function KPIDetailView({ event, kpis, kpi: rawKpi }: KPIDetailViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation(['kpiDetail', 'common', 'transactions', 'events']);
  const { user } = useAuth();

  // Keep legacy links alive after KPI fusion.
  const normalizedRawKpi = rawKpi === 'contributions' || rawKpi === 'pending' ? 'contributionStatus' : rawKpi;
  const isKpiValid = Boolean(normalizedRawKpi && isValidKPI(normalizedRawKpi));
  const kpi: KPIType | undefined = isKpiValid ? (normalizedRawKpi as KPIType) : undefined;
  const currentUserId = user?.id;
  const requestedParticipantId = searchParams.get('participantId') ?? undefined;
  const userStatusSelectableParticipants: KPISelectableParticipant[] = buildUserStatusSelectableParticipants(event, t);
  const selectedUserStatusParticipantId = resolveUserStatusParticipantId(
    userStatusSelectableParticipants,
    currentUserId,
    requestedParticipantId,
  );

  useEffect(() => {
    if (kpi !== 'userStatus') {
      return;
    }

    if (requestedParticipantId === selectedUserStatusParticipantId) {
      return;
    }

    if (!requestedParticipantId && !selectedUserStatusParticipantId) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    if (selectedUserStatusParticipantId) {
      nextSearchParams.set('participantId', selectedUserStatusParticipantId);
    } else {
      nextSearchParams.delete('participantId');
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [kpi, requestedParticipantId, searchParams, selectedUserStatusParticipantId, setSearchParams]);

  // Get KPI configuration
  const KPI_CONFIG = getKPIConfig(t);

  if (!kpi) {
    return <div className="text-center mt-10">{t('notFound', { ns: 'kpiDetail' })}</div>;
  }

  const targetTotal = event.participants.reduce((sum, participant) => {
    if (participant.type === 'user' || participant.type === 'guest') {
      return sum + (participant.contributionTarget ?? 0);
    }

    return sum;
  }, 0);

  const compliancePercent = targetTotal > 0 ? (kpis.totalContributions / targetTotal) * 100 : undefined;
  const adjustmentPending =
    Object.values(kpis.participantPending).reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0) / 2;
  const isCurrentUserParticipant = Boolean(
    currentUserId && userStatusSelectableParticipants.some((participant) => participant.id === currentUserId),
  );
  const userStatusSummaryData: KPIUserStatusSummaryData | undefined =
    kpi === 'userStatus'
      ? buildUserStatusSummaryData(event, kpis, selectedUserStatusParticipantId, currentUserId, t)
      : undefined;

  // Calculate KPI value using type-safe mapper
  const kpiValueMap: Record<KPIType, number> = {
    balance: kpis.potBalance,
    contributionStatus: compliancePercent ?? Number.NaN,
    userStatus: userStatusSummaryData?.compliancePercent ?? Number.NaN,
    expenses: kpis.totalExpenses,
  };
  const kpiValue = kpiValueMap[kpi];

  const contributionStatusSummaryData: KPIContributionStatusSummaryData | undefined =
    kpi === 'contributionStatus'
      ? {
          compliancePercent,
          netTotal: kpis.totalContributions,
          targetTotal,
          differenceTotal: kpis.pendingToCompensate,
          adjustmentPending,
        }
      : undefined;

  const shouldRenderBalanceBreakdown = kpi === 'balance' && Boolean(kpis.balanceBreakdown);
  const balanceBreakdownData = shouldRenderBalanceBreakdown
    ? buildBalanceBreakdownData(kpis.balanceBreakdown, event, t)
    : undefined;

  let items: KPIParticipantItem[] = [];
  if (!shouldRenderBalanceBreakdown && kpi !== 'userStatus') {
    const participantsData = kpis[KPI_CONFIG[kpi].kpiKey];
    items = buildKPIItems(participantsData, event, kpi, KPI_CONFIG, kpis.potExpenses, t);
  }

  const handleUserStatusParticipantChange = (participantId: string | undefined) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (participantId) {
      nextSearchParams.set('participantId', participantId);
    } else {
      nextSearchParams.delete('participantId');
    }

    setSearchParams(nextSearchParams);
  };

  return (
    <KPIDetailContent
      kpi={kpi}
      items={items}
      kpiValue={kpiValue}
      kpiConfig={KPI_CONFIG}
      balanceBreakdownData={balanceBreakdownData}
      contributionStatusSummaryData={contributionStatusSummaryData}
      userStatusSummaryData={userStatusSummaryData}
      userStatusSelectableParticipants={userStatusSelectableParticipants}
      selectedUserStatusParticipantId={selectedUserStatusParticipantId}
      isCurrentUserParticipant={isCurrentUserParticipant}
      onUserStatusParticipantChange={handleUserStatusParticipantChange}
    />
  );
}
