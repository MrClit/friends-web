export type PaymentType = 'contribution' | 'expense' | 'compensation';

export interface Expense {
  id: string;
  title: string;
  paymentType: PaymentType;
  amount: number;
  payer: string; // nombre del participante
  date: string; // formato ISO yyyy-mm-dd
  eventId: string;
}
