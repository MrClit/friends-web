import React from "react";
import type { PaymentType } from '../types';
import type { EventParticipant } from '../../events/types';

interface TransactionFormProps {
  type: PaymentType;
  title: string;
  setTitle: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  from: string;
  setParticipantId: (v: string) => void;
  participants: EventParticipant[];
  onSubmit: (e: React.FormEvent) => void;
}

const participantLabel: Record<PaymentType, string> = {
  contribution: 'Recibido de',
  expense: 'Pagado por',
  compensation: 'Pagado a',
};

export default function TransactionForm({
  type,
  title,
  setTitle,
  amount,
  setAmount,
  date,
  setDate,
  from,
  setParticipantId,
  participants,
  onSubmit,
}: TransactionFormProps) {
  return (
    <form className="flex flex-col gap-4 flex-1" onSubmit={onSubmit}>
      <div>
        <label className="block text-teal-700 dark:text-teal-200 font-medium mb-1">Título</label>
        <input
          className="w-full px-3 py-2 rounded border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-teal-700 dark:text-teal-200 font-medium mb-1">Importe</label>
        <input
          className="w-full px-3 py-2 rounded border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-teal-700 dark:text-teal-200 font-medium mb-1">Fecha</label>
        <input
          className="w-full px-3 py-2 rounded border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-teal-700 dark:text-teal-200 font-medium mb-1">{participantLabel[type]}</label>
        <select
          className="w-full px-3 py-2 rounded border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          value={from}
          onChange={e => setParticipantId(e.target.value)}
          required
        >
          <option value="" disabled>Selecciona un participante</option>
          {participants.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="mt-4 py-2 rounded bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-300"
        disabled={!title || !amount || !date || !from}
      >
        Guardar
      </button>
    </form>
  );
}
