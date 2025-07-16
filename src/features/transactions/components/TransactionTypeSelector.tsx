import type { PaymentType } from '../types';
import type { JSX } from 'react/jsx-runtime';
import { FaHandHoldingUsd, FaWallet, FaHandshake } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface TransactionTypeSelectorProps {
  value: PaymentType;
  onChange: (type: PaymentType) => void;
}

const TRANSACTION_TYPES: { key: PaymentType; icon: JSX.Element }[] = [
  { key: 'contribution', icon: <FaHandHoldingUsd className="text-blue-700 dark:text-blue-200" /> },
  { key: 'expense', icon: <FaWallet className="text-red-700 dark:text-red-200" /> },
  { key: 'compensation', icon: <FaHandshake className="text-green-700 dark:text-green-200" /> },
];

export default function TransactionTypeSelector({ value, onChange }: TransactionTypeSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center w-full">
      <div className="flex w-full bg-teal-50 dark:bg-teal-800 rounded-full p-1 shadow-inner border border-teal-200 dark:border-teal-700">
        {TRANSACTION_TYPES.map(tType => (
          <button
            key={tType.key}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:z-10 text-xs sm:text-sm
              ${value === tType.key
                ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-md scale-105'
                : 'bg-transparent text-teal-500 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-700'}`}
            onClick={() => onChange(tType.key)}
            type="button"
            style={{ minWidth: 0 }}
          >
            <span className="text-base flex items-center">{tType.icon}</span>
            <span>{t(`transactionTypeSelector.${tType.key}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
