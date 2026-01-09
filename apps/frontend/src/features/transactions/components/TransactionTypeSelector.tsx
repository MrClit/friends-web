import type { PaymentType } from '../types';
import { useTranslation } from 'react-i18next';
import { PAYMENT_TYPES, PAYMENT_TYPE_CONFIG } from '../constants';

interface TransactionTypeSelectorProps {
  value: PaymentType;
  onChange: (type: PaymentType) => void;
}

export default function TransactionTypeSelector({ value, onChange }: TransactionTypeSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center w-full">
      <div className="flex w-full bg-teal-50 dark:bg-teal-800 rounded-full p-1 shadow-inner border border-teal-200 dark:border-teal-700">
        {PAYMENT_TYPES.map((type) => {
          const config = PAYMENT_TYPE_CONFIG[type];
          const IconComponent = config.IconComponent;
          return (
            <button
              key={type}
              className={`flex-1 flex  items-center justify-center gap-2 px-2 py-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:z-10 text-xs sm:text-sm
                ${
                  value === type
                    ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-md scale-105'
                    : 'bg-transparent text-teal-500 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-700'
                }`}
              onClick={() => onChange(type)}
              type="button"
              style={{ minWidth: 0 }}
            >
              <span className="text-base flex items-center">
                <IconComponent className={config.colorLight} />
              </span>
              <span>{t(`transactionTypeSelector.${type}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
