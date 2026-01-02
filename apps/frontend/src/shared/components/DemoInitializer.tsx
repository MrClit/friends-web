import { useEffect } from 'react';
import { useEventsStore } from '../../features/events/store/useEventsStore';
import { useTransactionsStore } from '../../features/transactions/store/useTransactionsStore';
import { demoEventTitle, demoParticipants, demoTransactions } from '../demo/demoData';

export default function DemoInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('demoInitialized')) return;

    // Inserta el evento demo
    const addEvent = useEventsStore.getState().addEvent;
    addEvent(demoEventTitle, demoParticipants);
    // Busca el id generado
    const eventId = useEventsStore.getState().events.find((e) => e.title === demoEventTitle)?.id;
    if (!eventId) return;

    // Inserta transacciones demo
    const addExpense = useTransactionsStore.getState().addExpense;
    demoTransactions.forEach((tx) => {
      addExpense({
        eventId,
        paymentType: tx.paymentType,
        amount: tx.amount,
        participantId: tx.participantId,
        date: tx.date,
        title: tx.title,
      });
    });

    localStorage.setItem('demoInitialized', 'true');
  }, []);
  return null;
}
