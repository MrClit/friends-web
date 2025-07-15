export type PaymentType = 'contribution' | 'expense' | 'compensation';

export interface Transaction {
  id: string;
  title: string;
  paymentType: PaymentType;
  amount: number;
  participantId: string; // nombre del participante
  date: string; // formato ISO yyyy-mm-dd
  eventId: string;
}
