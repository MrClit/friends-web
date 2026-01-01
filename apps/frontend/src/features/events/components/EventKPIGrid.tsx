import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import KPIBox from './KPIBox';

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
  colorClass: string;
}

const KPI_CONFIG: KPIConfig[] = [
  {
    key: 'balance',
    labelKey: 'eventDetail.kpi.pot',
    getValue: (props) => props.potBalance,
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  {
    key: 'contributions',
    labelKey: 'eventDetail.kpi.contributions',
    getValue: (props) => props.totalContributions,
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    key: 'expenses',
    labelKey: 'eventDetail.kpi.expenses',
    getValue: (props) => props.totalExpenses,
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  {
    key: 'pending',
    labelKey: 'eventDetail.kpi.pending',
    getValue: (props) => props.pendingToCompensate,
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
];

export default function EventKPIGrid(props: EventKPIGridProps) {
  const { eventId } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
      {KPI_CONFIG.map((kpi) => (
        <KPIBox
          key={kpi.key}
          label={t(kpi.labelKey)}
          value={kpi.getValue(props)}
          colorClass={kpi.colorClass}
          onClick={() => navigate(`/event/${eventId}/kpi/${kpi.key}`)}
          style={{ cursor: 'pointer' }}
        />
      ))}
    </div>
  );
}
