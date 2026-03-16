/**
 * API Data Transfer Objects (DTOs)
 * These types match the backend NestJS API contracts
 */

// ============= Event Types =============
// Participant que es una referencia a un User existente
export interface UserParticipant {
  type: 'user';
  id: string; // UUID del User
  name?: string | undefined;
  email?: string | undefined;
  avatar?: string | undefined;
}

// Participant que es un invitado (sin cuenta)
export interface GuestParticipant {
  type: 'guest';
  id: string;
  name: string;
}

// Participant especial para el POT (gasto compartido)
export interface PotParticipant {
  type: 'pot';
  id: '0'; // Siempre será '0'
}

// Union type para participants
export type EventParticipantDto = UserParticipant | GuestParticipant | PotParticipant;

export type EventStatus = 'active' | 'archived';

export interface Event {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  status: EventStatus;
  participants: EventParticipantDto[];
  createdAt: string;
  updatedAt: string;
  lastModified: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  icon?: string;
  status?: EventStatus;
  participants: EventParticipantDto[];
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  icon?: string;
  status?: EventStatus;
  participants?: EventParticipantDto[];
  participantReplacements?: ParticipantReplacementDto[];
}

export interface ParticipantReplacementDto {
  fromGuestId: string;
  toUserId: string;
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
  updatedAt: string;
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

export interface PotExpenseTransactionBreakdown {
  id: string;
  title: string;
  amount: number;
  date: string;
}

export interface EventKPIBalanceBreakdown {
  inflows: {
    total: number;
    contributionsByParticipant: Record<string, number>;
  };
  outflows: {
    total: number;
    compensationsTotal: number;
    compensationsByParticipant: Record<string, number>;
    potExpensesTotal: number;
    potExpensesTransactions: PotExpenseTransactionBreakdown[];
  };
  participantNetWithPot: Record<string, number>;
  reconciliation: {
    inflows: number;
    outflows: number;
    potBalance: number;
    isConsistent: boolean;
  };
}

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
  balanceBreakdown: EventKPIBalanceBreakdown;
}
