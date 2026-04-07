import type { PaymentType } from '../types';
import { useTranslation } from 'react-i18next';
import { PAYMENT_TYPES, PAYMENT_TYPE_CONFIG } from '../constants';
import { cn } from '@/shared/utils';

interface TransactionTypeSelectorProps {
  value: PaymentType;
  onChange: (type: PaymentType) => void;
}

export function TransactionTypeSelector({ value, onChange }: TransactionTypeSelectorProps) {
  const { t } = useTranslation('transactions');
  return (
    <div className="flex justify-center w-full">
      <div className="flex p-1.5 bg-slate-100/80 dark:bg-emerald-900/40 rounded-2xl w-full max-w-md mx-auto">
        {PAYMENT_TYPES.map((type) => {
          const config = PAYMENT_TYPE_CONFIG[type];
          const IconComponent = config.IconComponent;
          const isActive = value === type;

          return (
            <button
              key={type}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300',
                'flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:z-10',
                isActive && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/10',
                !isActive &&
                  'text-slate-500 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-white hover:bg-white/50 dark:hover:bg-emerald-800/30',
              )}
              onClick={() => onChange(type)}
              type="button"
            >
              <IconComponent className="text-base" />
              <span className={cn(!isActive && 'hidden sm:inline')}>{t(`transactionTypeSelector.${type}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
