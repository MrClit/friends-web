/**
 * API Data Transfer Objects (DTOs)
 * These types match the backend NestJS API contracts
 */

// ============= Shared types (single source of truth) =============
import { EventStatus, PaymentType } from '@friends/shared-types';
import type {
  EventParticipant as EventParticipantDto,
  UserParticipant,
  GuestParticipant,
  PotParticipant,
} from '@friends/shared-types';

export { EventStatus, PaymentType };
export type { EventParticipantDto, UserParticipant, GuestParticipant, PotParticipant };

// ============= Event Types =============

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

// ============= Shopping List Types =============

export interface ShoppingItem {
  id: string;
  eventId: string;
  /** The whole item, quantity included in the text ('2 cajas de cerveza'). */
  name: string;
  createdBy: string | null;
  purchasedBy: string | null;
  /** Non-null means the item has been bought. */
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShoppingItemDto {
  name: string;
}

/**
 * Exactly the two fields the API accepts. The backend validates with forbidNonWhitelisted, so sending
 * a whole ShoppingItem back as the payload would be a 400.
 */
export interface UpdateShoppingItemDto {
  name?: string;
  purchased?: boolean;
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
