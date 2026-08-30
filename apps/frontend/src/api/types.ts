/**
 * API Data Transfer Objects (DTOs)
 * These types match the backend NestJS API contracts
 */

// ============= Shared types (single source of truth) =============
import { EventStatus, PaymentType, MealSlot, MEAL_SLOTS } from '@friends/shared-types';
import type {
  EventParticipant as EventParticipantDto,
  UserParticipant,
  GuestParticipant,
  PotParticipant,
} from '@friends/shared-types';

export { EventStatus, PaymentType, MealSlot, MEAL_SLOTS };
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

// ============= Calendar Types =============

/**
 * How many people one participant brings to one sitting.
 *
 * Rows are sparse: a cell nobody filled in has no row at all and reads as zero. The count is split
 * because a row can stand for a whole family, and the split changes what the meal has to cater for.
 */
export interface CalendarAttendance {
  id: string;
  mealId: string;
  /** A user's uuid or a guest's id. Never the pot, which does not eat. */
  participantId: string;
  adults: number;
  children: number;
}

/** One sitting of one day. Every day is created with the full set of MEAL_SLOTS. */
export interface CalendarMeal {
  id: string;
  dayId: string;
  slot: MealSlot;
  /** The plan for this sitting ('Paella'), as opposed to what the day is about. */
  description: string | null;
  attendances: CalendarAttendance[];
}

export interface CalendarDay {
  id: string;
  eventId: string;
  /** Calendar day in YYYY-MM-DD, never an instant. */
  date: string;
  /** What the day is about ('BAILE DE DISFRACES'). */
  description: string | null;
  /** Already ordered by the API following MEAL_SLOTS, so Lunch comes before Dinner. */
  meals: CalendarMeal[];
}

/**
 * A range is expanded by the client into individual days. The API ignores dates the event already has,
 * so an overlapping range is safe to send.
 */
export interface CreateCalendarDaysDto {
  dates: string[];
  description?: string;
}

/** Null clears the description, an absent property leaves it alone. */
export interface UpdateCalendarDayDto {
  description?: string | null;
}

export interface UpdateCalendarMealDto {
  description?: string | null;
}

export interface SetAttendanceDto {
  participantId: string;
  adults: number;
  children: number;
}

/**
 * The state of one cell after a write. Returned whether the row was created, updated or deleted, so
 * setting a cell back to zero answers with zeros rather than an empty body.
 */
export interface AttendanceCell {
  participantId: string;
  adults: number;
  children: number;
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
