import { Repository } from 'typeorm';
import { Event, EventParticipant, EventStatus } from '../../src/modules/events/entities/event.entity';
import { Transaction, PaymentType } from '../../src/modules/transactions/entities/transaction.entity';
import { User } from '../../src/modules/users/user.entity';
import { UserRole } from '../../src/modules/users/user-role.constants';

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
  date?: Date;
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
    date: input.date ?? new Date('2026-02-25T12:00:00.000Z'),
  });
}
