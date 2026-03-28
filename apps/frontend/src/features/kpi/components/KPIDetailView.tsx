import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { ErrorState } from '@/shared/components';
import { useAuth } from '@/features/auth/useAuth';
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

// React Query hooks
import { useEvent } from '../../../hooks/api/useEvents';
import { useEventKPIs } from '../../../hooks/api/useEventKPIs';
import { useDeletingStore } from '@/shared/store/useDeletingStore';

import { KPIDetailContent } from './KPIDetailContent.tsx';

/**
 * KPI Detail View Container
 * Handles all business logic: data fetching, validation, state management
 * Renders KPIDetailContent for presentation
 */
export function KPIDetailView({ eventId, kpi: rawKpi }: { eventId: string; kpi: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const setDeleting = useDeletingStore((state) => state.setDeleting);

  // React Query hooks - MUST be called before any early returns
  const { data: event, isLoading: isLoadingEvent, error: eventError, refetch: refetchEvent } = useEvent(eventId);
  const { data: kpis, isLoading: isLoadingKPIs, error: kpisError, refetch: refetchKPIs } = useEventKPIs(eventId);

  useEffect(() => {
    return () => {
      // Ensure detail queries are re-enabled after leaving the page.
      setDeleting(false);
    };
  }, [setDeleting]);

  // Keep legacy links alive after KPI fusion.
  const normalizedRawKpi = rawKpi === 'contributions' || rawKpi === 'pending' ? 'contributionStatus' : rawKpi;
  const isKpiValid = Boolean(normalizedRawKpi && isValidKPI(normalizedRawKpi));
  const kpi: KPIType | undefined = isKpiValid ? (normalizedRawKpi as KPIType) : undefined;
  const currentUserId = user?.id;
  const requestedParticipantId = searchParams.get('participantId') ?? undefined;
  const userStatusSelectableParticipants: KPISelectableParticipant[] = event
    ? buildUserStatusSelectableParticipants(event, t)
    : [];
  const selectedUserStatusParticipantId = resolveUserStatusParticipantId(
    userStatusSelectableParticipants,
    currentUserId,
    requestedParticipantId,
  );

  useEffect(() => {
    if (kpi !== 'userStatus' || !event) {
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
  }, [event, kpi, requestedParticipantId, searchParams, selectedUserStatusParticipantId, setSearchParams]);

  // Get KPI configuration
  const KPI_CONFIG = getKPIConfig(t);

  if (!kpi) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
  }

  // Loading state
  if (isLoadingEvent || isLoadingKPIs) {
    return <div className="text-center mt-10">{t('common.loading')}</div>;
  }

  // Error state
  const requestError = eventError ?? kpisError;
  if (requestError) {
    const isNotFoundOrNoAccess = requestError instanceof ApiError && requestError.status === 404;

    return (
      <ErrorState
        message={isNotFoundOrNoAccess ? t('common.notFoundOrNoAccess') : undefined}
        onRetry={
          isNotFoundOrNoAccess
            ? undefined
            : () => {
                void refetchEvent();
                void refetchKPIs();
              }
        }
      />
    );
  }

  if (!event || !kpis) {
    return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;
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
      event={event}
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
      onBack={() => navigate(`/event/${event.id}`)}
    />
  );
}
