export { PaymentType } from '@friends/shared-types';
import type { PaymentType } from '@friends/shared-types';

export interface Transaction {
  id: string;
  title: string;
  paymentType: PaymentType;
  amount: number;
  participantId: string;
  date: string;
  eventId: string;
}
