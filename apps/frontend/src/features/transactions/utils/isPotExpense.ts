import type { Transaction } from '../types';
import { POT_PARTICIPANT_ID } from '../../../shared/constants/pot';

/**
 * Check if a transaction is a pot expense
 * Pot expenses are expenses where the participant is the pot itself (POT_PARTICIPANT_ID)
 */
export function isPotExpense(transaction: Transaction): boolean {
  return transaction.paymentType === 'expense' && transaction.participantId === POT_PARTICIPANT_ID;
}
