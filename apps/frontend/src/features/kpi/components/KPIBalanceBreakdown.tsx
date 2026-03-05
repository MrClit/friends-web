import { useTranslation } from 'react-i18next';
import { formatAmount, formatDateShort } from '@/shared/utils/format';
import type { KPIBalanceBreakdownViewModel } from '../types';

interface KPIBalanceBreakdownProps {
  data: KPIBalanceBreakdownViewModel;
}

interface BreakdownSectionProps {
  title: string;
  subtotal: number;
  sign: '+' | '-';
  emptyMessage: string;
  children: React.ReactNode;
  hasItems: boolean;
}

function formatSignedAmount(amount: number, sign: '+' | '-') {
  return `${sign}${formatAmount(Math.abs(amount))}`;
}

function BreakdownSection({ title, subtotal, sign, emptyMessage, children, hasItems }: BreakdownSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-200">
          {t('kpiDetail.balanceBreakdown.subtotal')}: {formatSignedAmount(subtotal, sign)}
        </span>
      </div>

      {hasItems ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      )}
    </section>
  );
}

export function KPIBalanceBreakdown({ data }: KPIBalanceBreakdownProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {t('kpiDetail.balanceBreakdown.summaryTitle')}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-slate-600 dark:text-slate-300">{t('kpiDetail.balanceBreakdown.inflowsLabel')}</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {formatSignedAmount(data.inflowsTotal, '+')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-slate-600 dark:text-slate-300">
              {t('kpiDetail.balanceBreakdown.compensationsLabel')}
            </span>
            <span className="font-bold text-rose-700 dark:text-rose-300">
              {formatSignedAmount(data.compensationsTotal, '-')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-slate-600 dark:text-slate-300">
              {t('kpiDetail.balanceBreakdown.potExpensesLabel')}
            </span>
            <span className="font-bold text-rose-700 dark:text-rose-300">
              {formatSignedAmount(data.potExpensesTotal, '-')}
            </span>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />

          <div className="flex items-center justify-between text-base sm:text-lg">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {t('kpiDetail.balanceBreakdown.finalBalanceLabel')}
            </span>
            <span className="font-black text-slate-900 dark:text-white">{formatAmount(data.potBalance)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiDetail.balanceBreakdown.equation')}</p>

        {!data.isConsistent && (
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t('kpiDetail.balanceBreakdown.inconsistentWarning')}
          </p>
        )}
      </section>

      <BreakdownSection
        title={t('kpiDetail.balanceBreakdown.inflowsSectionTitle')}
        subtotal={data.inflowsTotal}
        sign="+"
        emptyMessage={t('kpiDetail.balanceBreakdown.emptyInflows')}
        hasItems={data.inflowItems.length > 0}
      >
        {data.inflowItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2"
          >
            <span className="font-medium text-slate-800 dark:text-slate-100">{item.name}</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {formatSignedAmount(item.amount, '+')}
            </span>
          </div>
        ))}
      </BreakdownSection>

      <BreakdownSection
        title={t('kpiDetail.balanceBreakdown.compensationsSectionTitle')}
        subtotal={data.compensationsTotal}
        sign="-"
        emptyMessage={t('kpiDetail.balanceBreakdown.emptyCompensations')}
        hasItems={data.compensationItems.length > 0}
      >
        {data.compensationItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2"
          >
            <span className="font-medium text-slate-800 dark:text-slate-100">{item.name}</span>
            <span className="font-bold text-rose-700 dark:text-rose-300">{formatSignedAmount(item.amount, '-')}</span>
          </div>
        ))}
      </BreakdownSection>

      <BreakdownSection
        title={t('kpiDetail.balanceBreakdown.potExpensesSectionTitle')}
        subtotal={data.potExpensesTotal}
        sign="-"
        emptyMessage={t('kpiDetail.balanceBreakdown.emptyPotExpenses')}
        hasItems={data.potExpenseItems.length > 0}
      >
        {data.potExpenseItems.map((item) => {
          const formattedDate = formatDateShort(item.date) || item.date;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formattedDate}</p>
              </div>
              <span className="font-bold text-rose-700 dark:text-rose-300 shrink-0">
                {formatSignedAmount(item.amount, '-')}
              </span>
            </div>
          );
        })}
      </BreakdownSection>
    </div>
  );
}
