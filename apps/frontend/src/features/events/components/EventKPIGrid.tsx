import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdAccountBalanceWallet, MdVolunteerActivism, MdShoppingBag, MdPerson } from 'react-icons/md';
import type { EventParticipant } from '@/features/events/types';
import { formatAmount } from '@/shared/utils/format';
import { KPIBox } from './KPIBox';

interface EventKPIGridProps {
  eventId: string;
  currentUserId?: string;
  participants: EventParticipant[];
  potBalance: number;
  totalContributions: number;
  totalExpenses: number;
  participantPending: Record<string, number>;
}

interface KPIConfig {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  borderColorClass: string;
  labelColorClass: string;
  valueFormat?: 'amount' | 'percent';
  helperText?: string;
}

const KPI_BORDER_COLOR: Record<string, string> = {
  blue: 'border-blue-500',
  rose: 'border-rose-500',
  emerald: 'border-emerald-500',
  amber: 'border-amber-500',
};

const KPI_LABEL_COLOR: Record<string, string> = {
  blue: 'text-blue-700 dark:text-blue-400',
  rose: 'text-rose-700 dark:text-rose-400',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  amber: 'text-amber-700 dark:text-amber-400',
};

export function EventKPIGrid(props: EventKPIGridProps) {
  const { eventId, currentUserId, participants, totalContributions, participantPending } = props;
  const navigate = useNavigate();
  const { t } = useTranslation('eventDetail');

  const targetTotal = participants.reduce((sum, participant) => {
    if (participant.type === 'user' || participant.type === 'guest') {
      return sum + (participant.contributionTarget ?? 0);
    }

    return sum;
  }, 0);

  const contributionStatusPercent = targetTotal > 0 ? (totalContributions / targetTotal) * 100 : Number.NaN;
  const pendingAdjustment =
    Object.values(participantPending).reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0) / 2;

  const currentUserParticipant = currentUserId
    ? participants.find((participant) => participant.id === currentUserId && participant.type !== 'pot')
    : undefined;

  const currentUserTarget =
    currentUserParticipant && (currentUserParticipant.type === 'user' || currentUserParticipant.type === 'guest')
      ? (currentUserParticipant.contributionTarget ?? 0)
      : 0;
  const currentUserDifference = currentUserId ? Number(participantPending[currentUserId] ?? 0) : 0;
  const currentUserNet = currentUserDifference + currentUserTarget;
  const currentUserCompliancePercent =
    currentUserParticipant && currentUserTarget > 0 ? (currentUserNet / currentUserTarget) * 100 : Number.NaN;
  const currentUserAdjustmentPending = Math.abs(currentUserDifference);

  const kpiConfig: KPIConfig[] = [
    {
      key: 'balance',
      label: t('kpi.pot'),
      value: props.potBalance,
      icon: <MdAccountBalanceWallet className="text-lg" />,
      borderColorClass: KPI_BORDER_COLOR.emerald,
      labelColorClass: KPI_LABEL_COLOR.emerald,
    },
    {
      key: 'expenses',
      label: t('kpi.expenses'),
      value: props.totalExpenses,
      icon: <MdShoppingBag className="text-lg" />,
      borderColorClass: KPI_BORDER_COLOR.rose,
      labelColorClass: KPI_LABEL_COLOR.rose,
    },
    {
      key: 'contributionStatus',
      label: t('kpi.contributionStatus'),
      value: contributionStatusPercent,
      icon: <MdVolunteerActivism className="text-lg" />,
      borderColorClass: KPI_BORDER_COLOR.blue,
      labelColorClass: KPI_LABEL_COLOR.blue,
      valueFormat: 'percent',
      helperText:
        targetTotal > 0
          ? t('kpi.contributionStatusHelper', { amount: formatAmount(pendingAdjustment) })
          : t('kpi.contributionStatusNoTargetHelper', { amount: formatAmount(pendingAdjustment) }),
    },
    {
      key: 'userStatus',
      label: t('kpi.userStatus'),
      value: currentUserCompliancePercent,
      icon: <MdPerson className="text-lg" />,
      borderColorClass: KPI_BORDER_COLOR.amber,
      labelColorClass: KPI_LABEL_COLOR.amber,
      valueFormat: 'percent',
      helperText: currentUserParticipant
        ? currentUserTarget > 0
          ? t('kpi.userStatusHelper', { amount: formatAmount(currentUserAdjustmentPending) })
          : t('kpi.userStatusNoTargetHelper', { amount: formatAmount(currentUserAdjustmentPending) })
        : t('kpi.userStatusNoParticipation'),
    },
  ];

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
      {kpiConfig.map((kpi) => (
        <KPIBox
          key={kpi.key}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          borderColorClass={kpi.borderColorClass}
          labelColorClass={kpi.labelColorClass}
          valueFormat={kpi.valueFormat}
          helperText={kpi.helperText}
          onClick={() => navigate(`/event/${eventId}/kpi/${kpi.key}`)}
        />
      ))}
    </section>
  );
}
