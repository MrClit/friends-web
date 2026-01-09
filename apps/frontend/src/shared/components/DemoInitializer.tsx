/**
 * DemoInitializer - Currently disabled during migration to React Query
 *
 * TODO: Re-enable when backend is ready by:
 * 1. Using useCreateEvent() and useCreateTransaction() hooks
 * 2. Handling async mutations properly
 * 3. Chaining event creation -> transactions creation
 *
 * Example implementation with React Query:
 *
 * import { useCreateEvent } from '@/hooks/api/useEvents';
 * import { useCreateTransaction } from '@/hooks/api/useTransactions';
 *
 * const createEvent = useCreateEvent();
 * const createTransaction = useCreateTransaction(eventId);
 *
 * createEvent.mutate({
 *   title: demoEventTitle,
 *   participants: demoParticipants
 * }, {
 *   onSuccess: (event) => {
 *     demoTransactions.forEach(tx => {
 *       createTransaction.mutate({
 *         paymentType: tx.paymentType,
 *         amount: tx.amount,
 *         participantId: tx.participantId,
 *         date: tx.date,
 *         concept: tx.title
 *       });
 *     });
 *   }
 * });
 */
export default function DemoInitializer() {
  // Disabled during migration - see TODO comment above
  return null;
}
