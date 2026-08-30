import { Repository } from 'typeorm';
import { Event, EventParticipant, EventStatus } from '../../src/modules/events/entities/event.entity';
import { Transaction, PaymentType } from '../../src/modules/transactions/entities/transaction.entity';
import { ShoppingItem } from '../../src/modules/shopping-list/entities/shopping-item.entity';
import { CalendarDay } from '../../src/modules/calendar/entities/calendar-day.entity';
import { CalendarMeal } from '../../src/modules/calendar/entities/calendar-meal.entity';
import { CalendarAttendance } from '../../src/modules/calendar/entities/calendar-attendance.entity';
import { User } from '../../src/modules/users/user.entity';
import { UserRole } from '../../src/modules/users/user-role.constants';
import { MealSlot, MEAL_SLOTS } from '@friends/shared-types';

interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
  avatar?: string;
}

interface CreateEventInput {
  title: string;
  description?: string;
  icon?: string;
  status?: EventStatus;
  participants?: EventParticipant[];
}

interface CreateTransactionInput {
  title: string;
  paymentType: PaymentType;
  amount: number;
  participantId: string;
  eventId: string;
  /** Calendar day in YYYY-MM-DD, matching the entity's declared type. */
  date?: string;
}

interface CreateShoppingItemInput {
  name: string;
  eventId: string;
  createdBy?: string | null;
  purchasedBy?: string | null;
  purchasedAt?: Date | null;
}

interface CreateCalendarDayInput {
  eventId: string;
  /** Calendar day in YYYY-MM-DD, matching the entity's declared type. */
  date?: string;
  description?: string | null;
  /** Defaults to the full set of sittings, which is what the API always creates. */
  slots?: readonly MealSlot[];
}

interface CreateCalendarAttendanceInput {
  mealId: string;
  participantId: string;
  adults?: number;
  children?: number;
}

export async function createUser(repository: Repository<User>, input: CreateUserInput): Promise<User> {
  return repository.save({
    email: input.email,
    name: input.name,
    avatar: input.avatar ?? '',
    role: input.role ?? 'user',
  });
}

export async function createEvent(repository: Repository<Event>, input: CreateEventInput): Promise<Event> {
  return repository.save({
    title: input.title,
    description: input.description ?? '',
    icon: input.icon ?? 'event',
    status: input.status ?? EventStatus.ACTIVE,
    participants: input.participants ?? [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
  });
}

export async function createTransaction(
  repository: Repository<Transaction>,
  input: CreateTransactionInput,
): Promise<Transaction> {
  return repository.save({
    title: input.title,
    paymentType: input.paymentType,
    amount: input.amount,
    participantId: input.participantId,
    eventId: input.eventId,
    date: input.date ?? '2026-02-25',
  });
}

export async function createShoppingItem(
  repository: Repository<ShoppingItem>,
  input: CreateShoppingItemInput,
): Promise<ShoppingItem> {
  return repository.save({
    name: input.name,
    eventId: input.eventId,
    createdBy: input.createdBy ?? null,
    purchasedBy: input.purchasedBy ?? null,
    purchasedAt: input.purchasedAt ?? null,
  });
}

/**
 * A calendar day with its sittings, which is the only shape the API ever produces: the meal rows are
 * created together with the day so their description has somewhere to live from the start.
 */
export async function createCalendarDay(
  repository: Repository<CalendarDay>,
  input: CreateCalendarDayInput,
): Promise<CalendarDay> {
  return repository.save({
    eventId: input.eventId,
    date: input.date ?? '2026-09-12',
    description: input.description ?? null,
    meals: (input.slots ?? MEAL_SLOTS).map((slot) => ({ slot, description: null })),
  });
}

export async function createCalendarAttendance(
  repository: Repository<CalendarAttendance>,
  input: CreateCalendarAttendanceInput,
): Promise<CalendarAttendance> {
  return repository.save({
    mealId: input.mealId,
    participantId: input.participantId,
    adults: input.adults ?? 1,
    children: input.children ?? 0,
  });
}

/** The sitting of a saved day, for tests that need to reach a meal id without a second query. */
export function mealOf(day: CalendarDay, slot: MealSlot): CalendarMeal {
  const meal = day.meals.find((candidate) => candidate.slot === slot);

  if (!meal) {
    throw new Error(`Day ${day.id} has no ${slot} sitting`);
  }

  return meal;
}
