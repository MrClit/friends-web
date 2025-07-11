import { FaArrowDown, FaArrowUp, FaExchangeAlt } from 'react-icons/fa';
import type { Transaction } from '../types';
import type { PaymentType } from '../types';
import type { JSX } from 'react/jsx-runtime';

const ICONS: Record<PaymentType, JSX.Element> = {
  contribution: <FaArrowDown className="text-green-500" />,
  expense: <FaArrowUp className="text-red-500" />,
  compensation: <FaExchangeAlt className="text-blue-500" />,
};

const PARTICIPANT_PREFIX: Record<PaymentType, string> = {
  contribution: 'Recibido de',
  expense: 'Pagado por',
  compensation: 'Pagado a',
};

interface MovementsListProps {
  expenses: Transaction[];
}

function groupByDate(expenses: Transaction[]) {
  return expenses.reduce((acc, exp) => {
    (acc[exp.date] = acc[exp.date] || []).push(exp);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TransactionsList({ expenses }: MovementsListProps) {
  // Ordenar por fecha descendente y agrupar
  const grouped = groupByDate([...expenses].sort((a, b) => b.date.localeCompare(a.date)));
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full max-w-md mb-8">
      {dates.length === 0 && (
        <div className="text-center text-teal-400 py-8">No hay movimientos aún.</div>
      )}
      {dates.map(date => (
        <div key={date} className="mb-6">
          <div className="text-sm text-teal-500 font-semibold mb-1 border-b border-teal-100 dark:border-teal-800 pb-1">
            {formatDateLong(date)}
          </div>
          <ul className="flex flex-col gap-2">
            {grouped[date].map(mov => (
              <li key={mov.id} className="flex items-center gap-3 bg-white dark:bg-teal-950 rounded-lg px-4 py-3 shadow-sm">
                <span className="text-xl">
                  {ICONS[mov.paymentType]}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-teal-900 dark:text-teal-100">{mov.title}</div>
                  <div className="text-xs text-teal-500">
                    {PARTICIPANT_PREFIX[mov.paymentType]} {mov.payer}
                  </div>
                </div>
                <div className="font-bold text-lg tabular-nums">
                  {mov.amount.toFixed(2)} €
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
