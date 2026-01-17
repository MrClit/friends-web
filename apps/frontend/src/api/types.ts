/**
 * API Data Transfer Objects (DTOs)
 * These types match the backend NestJS API contracts
 */

// ============= Event Types =============

export interface EventParticipantDto {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  title: string;
  participants: EventParticipantDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  participants: EventParticipantDto[];
}

export interface UpdateEventDto {
  title?: string;
  participants?: EventParticipantDto[];
}

// ============= Transaction Types =============

export type PaymentType = 'contribution' | 'expense' | 'compensation';

export interface Transaction {
  id: string;
  eventId: string;
  participantId: string;
  paymentType: PaymentType;
  amount: number;
  title: string;
  date: string;
  createdAt: string;
}

export interface CreateTransactionDto {
  title: string;
  participantId: string;
  paymentType: PaymentType;
  amount: number;
  date: string;
}

export interface UpdateTransactionDto {
  title?: string;
  participantId?: string;
  paymentType?: PaymentType;
  amount?: number;
  date?: string;
}

// ============= Pagination Types =============

export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  hasMore: boolean;
  totalDates: number;
  loadedDates: number;
}

// ============= KPI Types =============

export interface EventKPIs {
  totalExpenses: number;
  totalContributions: number;
  totalCompensations: number;
  potBalance: number;
  pendingToCompensate: number;
  participantBalances: Record<string, number>;
  participantContributions: Record<string, number>;
  participantExpenses: Record<string, number>;
  participantCompensations: Record<string, number>;
  participantPending: Record<string, number>;
  potExpenses: number;
}
