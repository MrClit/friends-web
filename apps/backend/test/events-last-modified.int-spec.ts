import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../src/common/types/authenticated-user.type';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { EventsService } from '../src/modules/events/events.service';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { createEvent, createTransaction } from './utils/test-factories';

describe('EventsService lastModified (integration)', () => {
  let app: INestApplication;
  let eventsService: EventsService;
  let eventRepository: Repository<Event>;
  let transactionRepository: Repository<Transaction>;

  const actor: AuthenticatedUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    role: 'user',
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    eventsService = app.get(EventsService);
    eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  beforeEach(async () => {
    await transactionRepository.createQueryBuilder().delete().from(Transaction).execute();
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uses event.updatedAt as lastModified when there are no transactions', async () => {
    const savedEvent = await createEvent(eventRepository, {
      title: 'No transactions event',
      description: 'No tx',
      icon: 'calendar',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'user', id: actor.id }, { type: 'guest', id: 'g1', name: 'Guest 1' }],
    });

    const event = await eventsService.findOne(savedEvent.id, actor);

    expect(event.lastModified).toBeDefined();
    expect(event.lastModified?.getTime()).toBe(event.updatedAt.getTime());
  });

  it('uses max(event.updatedAt, latest transaction.updatedAt) as lastModified', async () => {
    const savedEvent = await createEvent(eventRepository, {
      title: 'With transactions event',
      description: 'Has tx',
      icon: 'wallet',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'user', id: actor.id }, { type: 'guest', id: 'g1', name: 'Guest 1' }],
    });

    const savedTx = await createTransaction(transactionRepository, {
      title: 'Expense 1',
      paymentType: 'expense',
      amount: 25,
      participantId: 'g1',
      date: new Date('2026-02-20T12:00:00.000Z'),
      eventId: savedEvent.id,
    });

    const eventUpdatedAt = new Date('2026-02-20T10:00:00.000Z');
    const txUpdatedAt = new Date('2026-02-20T16:00:00.000Z');

    await eventRepository.query('UPDATE events SET updated_at = $1 WHERE id = $2', [eventUpdatedAt, savedEvent.id]);
    await transactionRepository.query('UPDATE transactions SET updated_at = $1 WHERE id = $2', [
      txUpdatedAt,
      savedTx.id,
    ]);

    const event = await eventsService.findOne(savedEvent.id, actor);

    expect(event.lastModified).toBeDefined();
    expect(event.lastModified?.getTime()).toBe(txUpdatedAt.getTime());
  });
});
