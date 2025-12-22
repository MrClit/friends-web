import { useNavigate, useParams } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import KPIBox from '../features/events/components/KPIBox';
import { useEventsStore } from '../features/events/store/useEventsStore';
import { useTransactionsStore } from '../features/transactions/store/useTransactionsStore';
import { formatAmount } from '../shared/utils/formatAmount';
import { useTranslation } from 'react-i18next';

export default function KPIDetail() {
  const navigate = useNavigate();
  const { id, kpi } = useParams<{ id: string; kpi: KPIType }>();
  const { t } = useTranslation();

  const event = useEventsStore(state => state.events.find(e => e.id === id));

  const getTotalExpensesByEvent = useTransactionsStore(state => state.getTotalExpensesByEvent);
  const getTotalContributionsByEvent = useTransactionsStore(state => state.getTotalContributionsByEvent);
  const getPotBalanceByEvent = useTransactionsStore(state => state.getPotBalanceByEvent);
  const getPendingToCompensateByEvent = useTransactionsStore(state => state.getPendingToCompensateByEvent);
  
  const getTotalExpensesByParticipant = useTransactionsStore(state => state.getTotalExpensesByParticipant);
  const getTotalContributionsByParticipant = useTransactionsStore(state => state.getTotalContributionsByParticipant);
  const getPendingToCompensateByParticipant = useTransactionsStore(state => state.getPendingToCompensateByParticipant);
  const getBalanceByParticipant = useTransactionsStore(state => state.getBalanceByParticipant);

  const KPI_CONFIG = {
    pot: {
      label: t('kpiDetail.kpi.pot'),
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      participantFn: getBalanceByParticipant,
    },
    contributions: {
      label: t('kpiDetail.kpi.contributions'),
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      participantFn: getTotalContributionsByParticipant,
    },
    expenses: {
      label: t('kpiDetail.kpi.expenses'),
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      participantFn: getTotalExpensesByParticipant,
    },
    pending: {
      label: t('kpiDetail.kpi.pending'),
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      participantFn: getPendingToCompensateByParticipant,
    },
  } as const;
  type KPIType = keyof typeof KPI_CONFIG;

  if (!event || !kpi || !(kpi in KPI_CONFIG)) return <div className="text-center mt-10">{t('kpiDetail.notFound')}</div>;

  // KPI values
  const totalExpenses = event ? getTotalExpensesByEvent(event.id) : 0;
  const totalContributions = event ? getTotalContributionsByEvent(event.id) : 0;
  const potBalance = event ? getPotBalanceByEvent(event.id) : 0;
  const pendingToCompensate = event ? getPendingToCompensateByEvent(event.id) : 0;

  // Participant amounts calculation
  const participantAmounts = KPI_CONFIG[kpi].participantFn(event).map(p => ({
    name: p.participant.name,
    value: formatAmount(p.total)
  }));

  // KPI value
  let kpiValue = 0;
  if (kpi === 'pot') kpiValue = potBalance;
  if (kpi === 'contributions') kpiValue = totalContributions;
  if (kpi === 'expenses') kpiValue = totalExpenses;
  if (kpi === 'pending') kpiValue = pendingToCompensate;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <div className="flex items-center justify-between w-full max-w-2xl mt-8 mb-4 gap-2">
        <button 
          type="button"
          onClick={() => navigate(`/event/${event.id}`)}
          className="p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
          aria-label="Volver"
        >
          <MdArrowBack className="text-teal-900 dark:text-teal-100 text-2xl" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-center flex-1 truncate text-teal-900 dark:text-teal-100">{event.title}</h1>
        <div className="w-10" />
      </div>
      <div className="w-full max-w-2xl mb-8">
        <KPIBox 
					label={KPI_CONFIG[kpi].label} 
					value={kpiValue} 
					colorClass={KPI_CONFIG[kpi].colorClass + ' py-8'} 
					labelClassName='!text-lg'
					valueClassName='!text-4xl'
				/>
      </div>
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 text-teal-700 dark:text-teal-100">{t('kpiDetail.participants')}</h2>
        <ul className="flex flex-col gap-2">
          {event.participants?.map((p, idx) => (
            <li key={p.name}
                className="flex items-center gap-3 bg-white dark:bg-teal-950 rounded-lg px-4 py-3 shadow-sm hover:bg-teal-50 dark:hover:bg-teal-900 transition-colors">
              <div className="flex-1">
                <div className="font-semibold text-teal-900 dark:text-teal-100 text-base">{p.name}</div>
              </div>
              <div className="font-bold text-lg tabular-nums text-teal-700 dark:text-teal-200">{participantAmounts[idx].value}</div>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-xs text-teal-700 dark:text-teal-200 opacity-80">
          <strong>{t('kpiDetail.noteTitle')}</strong> <br />
          <span className="block mt-1">
            <span className="font-semibold">{t('kpiDetail.kpi.pot')}</span>: {t('kpiDetail.notePot')}<br />
            <span className="font-semibold">{t('kpiDetail.kpi.contributions')}</span>: {t('kpiDetail.noteContributions')}<br />
            <span className="font-semibold">{t('kpiDetail.kpi.expenses')}</span>: {t('kpiDetail.noteExpenses')}<br />
            <span className="font-semibold">{t('kpiDetail.kpi.pending')}</span>: {t('kpiDetail.notePending')}
          </span>
        </div>
      </div>
    </div>
  );
}
