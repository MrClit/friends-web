import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { TransactionPaginationService } from '../src/modules/transactions/services/transaction-pagination.service';
import { createEvent, createTransaction } from './utils/test-factories';

describe('TransactionPaginationService (integration)', () => {
  let app: INestApplication;
  let service: TransactionPaginationService;
  let eventRepository: Repository<Event>;
  let transactionRepository: Repository<Transaction>;

  interface DistinctDateRow {
    date: string;
  }

  const isDistinctDateRow = (value: unknown): value is DistinctDateRow => {
    if (typeof value !== 'object' || value === null || !('date' in value)) {
      return false;
    }

    return typeof value.date === 'string';
  };

  const parseDistinctDateRows = (value: unknown): DistinctDateRow[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(isDistinctDateRow);
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    service = app.get(TransactionPaginationService);
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

  it('throws NotFoundException when event does not exist', async () => {
    await expect(service.findByEventPaginated('00000000-0000-0000-0000-000000000001', 2, 0)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns transactions grouped by date and proper pagination metadata', async () => {
    const event = await createEvent(eventRepository, {
      title: 'Integration Event',
      description: 'Testing pagination',
      icon: 'party',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });

    const otherEvent = await createEvent(eventRepository, {
      title: 'Other Event',
      description: 'Should be excluded',
      icon: 'lock',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });

    await Promise.all([
      createTransaction(transactionRepository, {
        title: 'A1',
        paymentType: 'expense',
        amount: 10,
        participantId: 'g1',
        date: '2026-02-03',
        eventId: event.id,
      }),
      createTransaction(transactionRepository, {
        title: 'A2',
        paymentType: 'expense',
        amount: 20,
        participantId: 'g1',
        date: '2026-02-03',
        eventId: event.id,
      }),
      createTransaction(transactionRepository, {
        title: 'B1',
        paymentType: 'contribution',
        amount: 30,
        participantId: 'g1',
        date: '2026-02-02',
        eventId: event.id,
      }),
      createTransaction(transactionRepository, {
        title: 'C1',
        paymentType: 'expense',
        amount: 40,
        participantId: 'g1',
        date: '2026-02-01',
        eventId: event.id,
      }),
      createTransaction(transactionRepository, {
        title: 'C2',
        paymentType: 'compensation',
        amount: 50,
        participantId: 'g1',
        date: '2026-02-01',
        eventId: event.id,
      }),
      createTransaction(transactionRepository, {
        title: 'OTHER',
        paymentType: 'expense',
        amount: 999,
        participantId: 'g1',
        date: '2026-02-03',
        eventId: otherEvent.id,
      }),
    ]);

    const rawDistinctDates: unknown = await transactionRepository.query(
      `
        SELECT DISTINCT TO_CHAR(t.date, 'YYYY-MM-DD') AS date
        FROM transactions t
        WHERE t.event_id = $1
        ORDER BY date DESC
      `,
      [event.id],
    );
    const distinctDates = parseDistinctDateRows(rawDistinctDates);

    const expectedPage1Dates = distinctDates.slice(0, 2).map((row) => row.date);
    const expectedPage2Dates = distinctDates.slice(2).map((row) => row.date);

    const page1 = await service.findByEventPaginated(event.id, 2, 0);

    expect(page1.totalDates).toBe(3);
    expect(page1.loadedDates).toBe(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.transactions).toHaveLength(3);

    // The raw-SQL path must hand back the same calendar-day string as an entity read,
    // with no normalization in between.
    expect(typeof page1.transactions[0].date).toBe('string');
    expect(page1.transactions[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const page1Dates = page1.transactions.map((tx) => tx.date);
    expect(new Set(page1Dates)).toEqual(new Set(expectedPage1Dates));
    expect(page1.transactions.every((tx) => tx.eventId === event.id)).toBe(true);

    const page2 = await service.findByEventPaginated(event.id, 2, 2);

    expect(page2.totalDates).toBe(3);
    expect(page2.loadedDates).toBe(1);
    expect(page2.hasMore).toBe(false);
    expect(page2.transactions).toHaveLength(2);

    const page2Dates = page2.transactions.map((tx) => tx.date);
    expect(new Set(page2Dates)).toEqual(new Set(expectedPage2Dates));
    expect(page2.transactions.every((tx) => tx.eventId === event.id)).toBe(true);
  });
});
