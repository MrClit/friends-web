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
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function KPIContributionStatusSummary({ data }: KPIContributionStatusSummaryProps) {
  const { t } = useTranslation();
  const hasTargets = data.targetTotal > 0;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        {t('kpiDetail.contributionStatus.summaryTitle')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryMetricCard
          label={t('kpiDetail.contributionStatus.complianceLabel')}
          value={hasTargets ? formatPercent(data.compliancePercent) : t('kpiDetail.contributionStatus.noTargetValue')}
        />
        <SummaryMetricCard
          label={t('kpiDetail.contributionStatus.adjustmentPendingLabel')}
          value={formatAmount(data.adjustmentPending)}
        />
        <SummaryMetricCard
          label={t('kpiDetail.contributionStatus.netTotalLabel')}
          value={formatAmount(data.netTotal)}
        />
        <SummaryMetricCard
          label={t('kpiDetail.contributionStatus.targetTotalLabel')}
          value={formatAmount(data.targetTotal)}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {t('kpiDetail.contributionStatus.differenceLabel')}
        </p>
        <p className="text-lg font-black text-slate-900 dark:text-white">{formatSignedAmount(data.differenceTotal)}</p>
      </div>

      {!hasTargets && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiDetail.contributionStatus.noTargetHint')}</p>
      )}
    </section>
  );
}
