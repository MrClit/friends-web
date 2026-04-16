import { useTranslation } from 'react-i18next';
import { formatAmount } from '@/shared/utils/format';
import type { KPIContributionStatusSummaryData } from '../types';

interface KPIContributionStatusSummaryProps {
  data: KPIContributionStatusSummaryData;
}

function formatPercent(value?: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return '--';
  }

  return `${value.toFixed(1)}%`;
}

function formatSignedAmount(value: number) {
  if (value === 0) {
    return formatAmount(0);
  }

  const sign = value > 0 ? '+' : '-';
  return `${sign}${formatAmount(Math.abs(value))}`;
}

interface SummaryMetricCardProps {
  label: string;
  value: string;
}

function SummaryMetricCard({ label, value }: SummaryMetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function KPIContributionStatusSummary({ data }: KPIContributionStatusSummaryProps) {
  const { t } = useTranslation('kpiDetail');
  const hasTargets = data.targetTotal > 0;

  return (
    <section className="bg-white dark:bg-emerald-950 rounded-2xl shadow-soft border border-slate-100 dark:border-emerald-800 p-4 sm:p-6 space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        {t('contributionStatus.summaryTitle')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryMetricCard
          label={t('contributionStatus.complianceLabel')}
          value={hasTargets ? formatPercent(data.compliancePercent) : t('contributionStatus.noTargetValue')}
        />
        <SummaryMetricCard
          label={t('contributionStatus.adjustmentPendingLabel')}
          value={formatAmount(data.adjustmentPending)}
        />
        <SummaryMetricCard label={t('contributionStatus.netTotalLabel')} value={formatAmount(data.netTotal)} />
        <SummaryMetricCard label={t('contributionStatus.targetTotalLabel')} value={formatAmount(data.targetTotal)} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {t('contributionStatus.differenceLabel')}
        </p>
        <p className="text-lg font-black text-slate-900 dark:text-white">{formatSignedAmount(data.differenceTotal)}</p>
      </div>

      {!hasTargets && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('contributionStatus.noTargetHint')}</p>
      )}
    </section>
  );
}
