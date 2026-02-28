import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdAccountBalanceWallet, MdVolunteerActivism, MdShoppingBag, MdCreditCard } from 'react-icons/md';
import { KPIBox } from './KPIBox';

interface EventKPIGridProps {
  eventId: string;
  potBalance: number;
  totalContributions: number;
  totalExpenses: number;
  pendingToCompensate: number;
}

interface KPIConfig {
  key: string;
  labelKey: string;
  getValue: (props: EventKPIGridProps) => number;
  icon: React.ReactNode;
  borderColorClass: string;
  labelColorClass: string;
}

const KPI_CONFIG: KPIConfig[] = [
  {
    key: 'balance',
    labelKey: 'eventDetail.kpi.pot',
    getValue: (props) => props.potBalance,
    icon: <MdAccountBalanceWallet className="text-lg" />,
    borderColorClass: 'border-emerald-500',
    labelColorClass: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    key: 'contributions',
    labelKey: 'eventDetail.kpi.contributions',
    getValue: (props) => props.totalContributions,
    icon: <MdVolunteerActivism className="text-lg" />,
    borderColorClass: 'border-blue-500',
    labelColorClass: 'text-blue-700 dark:text-blue-400',
  },
  {
    key: 'expenses',
    labelKey: 'eventDetail.kpi.expenses',
    getValue: (props) => props.totalExpenses,
    icon: <MdShoppingBag className="text-lg" />,
    borderColorClass: 'border-rose-500',
    labelColorClass: 'text-rose-700 dark:text-rose-400',
  },
  {
    key: 'pending',
    labelKey: 'eventDetail.kpi.pending',
    getValue: (props) => props.pendingToCompensate,
    icon: <MdCreditCard className="text-lg" />,
    borderColorClass: 'border-amber-400',
    labelColorClass: 'text-amber-700 dark:text-amber-400',
  },
];

export function EventKPIGrid(props: EventKPIGridProps) {
  const { eventId } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {KPI_CONFIG.map((kpi) => (
        <KPIBox
          key={kpi.key}
          label={t(kpi.labelKey)}
          value={kpi.getValue(props)}
          icon={kpi.icon}
          borderColorClass={kpi.borderColorClass}
          labelColorClass={kpi.labelColorClass}
          onClick={() => navigate(`/event/${eventId}/kpi/${kpi.key}`)}
        />
      ))}
    </section>
  );
}
