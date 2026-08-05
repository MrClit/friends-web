import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { PaymentType } from '@friends/shared-types';
import { createEvent, createTransaction } from './utils/test-factories';

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `date` is a Postgres `date` column, which carries no time and which TypeORM hydrates
 * as a 'YYYY-MM-DD' string. These tests pin that the runtime value matches the declared
 * `string` type on every read, so no caller is tempted to treat it as a Date again.
 */
describe('Transaction.date runtime type (integration)', () => {
  let app: INestApplication;
  let eventRepository: Repository<Event>;
  let transactionRepository: Repository<Transaction>;
  let event: Event;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  beforeEach(async () => {
    await transactionRepository.createQueryBuilder().delete().from(Transaction).execute();
    await eventRepository.createQueryBuilder().delete().from(Event).execute();

    event = await createEvent(eventRepository, {
      title: 'Date Event',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a YYYY-MM-DD string when reading a transaction back', async () => {
    const saved = await createTransaction(transactionRepository, {
      title: 'Dinner',
      paymentType: PaymentType.EXPENSE,
      amount: 33.5,
      participantId: 'g1',
      eventId: event.id,
      date: '2026-02-25',
    });

    const found = await transactionRepository.findOne({ where: { id: saved.id } });

    expect(found).not.toBeNull();
    expect(typeof found!.date).toBe('string');
    expect(found!.date).toBe('2026-02-25');
  });

  it('returns YYYY-MM-DD strings when reading a collection', async () => {
    await createTransaction(transactionRepository, {
      title: 'Contribution',
      paymentType: PaymentType.CONTRIBUTION,
      amount: 21,
      participantId: 'g1',
      eventId: event.id,
      date: '2026-01-31',
    });

    const [found] = await transactionRepository.find({ where: { eventId: event.id } });

    expect(typeof found.date).toBe('string');
    expect(found.date).toBe('2026-01-31');
  });

  it('keeps the calendar day after an update', async () => {
    const saved = await createTransaction(transactionRepository, {
      title: 'Taxi',
      paymentType: PaymentType.EXPENSE,
      amount: 12,
      participantId: 'g1',
      eventId: event.id,
      date: '2026-03-01',
    });

    await transactionRepository.update(saved.id, { date: '2026-03-02' });
    const found = await transactionRepository.findOneOrFail({ where: { id: saved.id } });

    expect(found.date).toBe('2026-03-02');
  });

  it('never drifts to the neighbouring day regardless of the server timezone', async () => {
    // A Date built at local midnight and read back through UTC is exactly how the
    // paginated route used to lose a day; the string form cannot drift.
    await createTransaction(transactionRepository, {
      title: 'New year',
      paymentType: PaymentType.EXPENSE,
      amount: 5,
      participantId: 'g1',
      eventId: event.id,
      date: '2026-01-01',
    });

    const [found] = await transactionRepository.find({ where: { eventId: event.id } });

    expect(found.date).toMatch(CALENDAR_DAY);
    expect(found.date).toBe('2026-01-01');
  });

  it('is directly usable as a grouping key without normalization', async () => {
    await createTransaction(transactionRepository, {
      title: 'Breakfast',
      paymentType: PaymentType.EXPENSE,
      amount: 8,
      participantId: 'g1',
      eventId: event.id,
      date: '2026-02-25',
    });
    await createTransaction(transactionRepository, {
      title: 'Lunch',
      paymentType: PaymentType.EXPENSE,
      amount: 16,
      participantId: 'g1',
      eventId: event.id,
      date: '2026-02-25',
    });

    const found = await transactionRepository.find({ where: { eventId: event.id } });
    const days = new Set(found.map((transaction) => transaction.date));

    expect(found).toHaveLength(2);
    expect(days.size).toBe(1);
  });
});
