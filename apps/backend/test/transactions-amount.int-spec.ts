import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { PaymentType } from '@friends/shared-types';
import { createEvent, createTransaction } from './utils/test-factories';

/**
 * `amount` is a decimal column, which the Postgres driver returns as a string. These tests
 * pin the column transformer that keeps the runtime value matching the declared `number`.
 */
describe('Transaction.amount runtime type (integration)', () => {
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
      title: 'Amount Event',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a number when reading a transaction back', async () => {
    const saved = await createTransaction(transactionRepository, {
      title: 'Dinner',
      paymentType: PaymentType.EXPENSE,
      amount: 33.5,
      participantId: 'g1',
      eventId: event.id,
    });

    const found = await transactionRepository.findOne({ where: { id: saved.id } });

    expect(found).not.toBeNull();
    expect(typeof found!.amount).toBe('number');
    expect(found!.amount).toBe(33.5);
  });

  it('returns numbers when reading a collection', async () => {
    await createTransaction(transactionRepository, {
      title: 'Contribution',
      paymentType: PaymentType.CONTRIBUTION,
      amount: 21,
      participantId: 'g1',
      eventId: event.id,
    });

    const [found] = await transactionRepository.find({ where: { eventId: event.id } });

    expect(typeof found.amount).toBe('number');
    expect(found.amount).toBe(21);
  });

  it('round-trips values that need both decimals', async () => {
    const saved = await createTransaction(transactionRepository, {
      title: 'Odd cents',
      paymentType: PaymentType.EXPENSE,
      amount: 10.01,
      participantId: 'g1',
      eventId: event.id,
    });

    const found = await transactionRepository.findOneOrFail({ where: { id: saved.id } });

    expect(found.amount).toBe(10.01);
  });

  it('keeps the value arithmetic-safe without coercion', async () => {
    await createTransaction(transactionRepository, {
      title: 'First',
      paymentType: PaymentType.EXPENSE,
      amount: 10.5,
      participantId: 'g1',
      eventId: event.id,
    });
    await createTransaction(transactionRepository, {
      title: 'Second',
      paymentType: PaymentType.EXPENSE,
      amount: 4.5,
      participantId: 'g1',
      eventId: event.id,
    });

    const found = await transactionRepository.find({ where: { eventId: event.id } });
    const total = found.reduce((sum, transaction) => sum + transaction.amount, 0);

    // A string amount would concatenate here instead of adding up.
    expect(total).toBe(15);
  });
});
