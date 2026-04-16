import { useTranslation } from 'react-i18next';
import { formatAmount } from '@/shared/utils/format';
import { formatPercent, formatSignedAmount } from '../utils/utils';
import type { KPISelectableParticipant, KPIUserStatusSummaryData } from '../types';
import { KPIParticipantCombobox } from './KPIParticipantCombobox';

interface KPIUserStatusSummaryProps {
  data?: KPIUserStatusSummaryData;
  selectableParticipants: KPISelectableParticipant[];
  selectedParticipantId?: string;
  isCurrentUserParticipant: boolean;
  onSelectParticipant: (participantId: string | undefined) => void;
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

export function KPIUserStatusSummary({
  data,
  selectableParticipants,
  selectedParticipantId,
  isCurrentUserParticipant,
  onSelectParticipant,
}: KPIUserStatusSummaryProps) {
  const { t } = useTranslation('kpiDetail');

  const hasTargets = (data?.targetTotal ?? 0) > 0;

  return (
    <section className="bg-white dark:bg-emerald-950 rounded-2xl shadow-soft border border-slate-100 dark:border-emerald-800 p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('userStatus.summaryTitle')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('userStatus.selectorHint')}</p>
        </div>

        <KPIParticipantCombobox
          selectableParticipants={selectableParticipants}
          selectedParticipantId={selectedParticipantId}
          onSelectParticipant={onSelectParticipant}
        />
      </div>

      {data ? (
        <>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{data.participantName}</p>
            {data.isCurrentUser && (
              <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 text-xs font-semibold">
                {t('userStatus.youBadge')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SummaryMetricCard
              label={t('userStatus.complianceLabel')}
              value={hasTargets ? formatPercent(data.compliancePercent) : t('userStatus.noTargetValue')}
            />
            <SummaryMetricCard
              label={t('userStatus.adjustmentPendingLabel')}
              value={formatAmount(data.adjustmentPending)}
            />
            <SummaryMetricCard label={t('userStatus.netTotalLabel')} value={formatAmount(data.netTotal)} />
            <SummaryMetricCard label={t('userStatus.targetTotalLabel')} value={formatAmount(data.targetTotal)} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('userStatus.differenceLabel')}
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {formatSignedAmount(data.differenceTotal)}
            </p>
          </div>

          {!hasTargets && <p className="text-xs text-slate-500 dark:text-slate-400">{t('userStatus.noTargetHint')}</p>}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
          {isCurrentUserParticipant ? t('userStatus.noSelection') : t('userStatus.noParticipation')}
        </div>
      )}
    </section>
  );
}
