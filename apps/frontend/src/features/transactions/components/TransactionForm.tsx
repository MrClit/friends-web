import React from 'react';
import type { PaymentType } from '../types';
import type { EventParticipant } from '../../events/types';
import { useTranslation } from 'react-i18next';
import { TransactionParticipantCombobox } from './TransactionParticipantCombobox';

export interface TransactionFormState {
  type: PaymentType;
  title: string;
  setTitle: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  participantId: string;
  setParticipantId: (v: string) => void;
}

interface TransactionFormProps {
  fields: TransactionFormState;
  participants: EventParticipant[];
  onSubmit: (e: React.FormEvent) => void;
}

export function TransactionForm({ fields, participants, onSubmit }: TransactionFormProps) {
  const { t } = useTranslation();
  const { type, title, setTitle, amount, setAmount, date, setDate, participantId, setParticipantId } = fields;

  return (
    <form id="transaction-form" className="space-y-8 pb-6" onSubmit={onSubmit}>
      {/* Title input */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
          {t('transactionForm.titleLabel')}
        </label>
        <input
          className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
          placeholder={t('transactionForm.titlePlaceholder')}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Amount + Date grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Amount input with € symbol */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
            {t('transactionForm.amountLabel')}
          </label>
          <div className="relative">
            <input
              className="w-full pl-5 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-700 font-medium"
              placeholder="0,00"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
          </div>
        </div>

        {/* Date input */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
            {t('transactionForm.dateLabel')}
          </label>
          <input
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-50/50 dark:bg-emerald-900/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white font-medium"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Participant combobox */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-emerald-100 px-1">
          {t(`transactionForm.participantLabel.${type}`)}
        </label>
        <TransactionParticipantCombobox
          participants={participants}
          paymentType={type}
          value={participantId}
          onChange={setParticipantId}
        />
      </div>
    </form>
  );
}
