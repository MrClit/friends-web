import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { EventParticipantsService } from '../src/modules/events/services/event-participants.service';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createEvent, createTransaction, createUser } from './utils/test-factories';
import { buildAuthHeader, getDataObjectFromBody } from './utils/test-http-helpers';

const GUEST_ID = 'g-1';

describe('Event participant replacements (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let eventRepository: Repository<Event>;
  let transactionRepository: Repository<Transaction>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    jwtService = app.get(JwtService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  beforeEach(async () => {
    await transactionRepository.createQueryBuilder().delete().from(Transaction).execute();
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const httpServer = () => app.getHttpServer() as Parameters<typeof request>[0];

  /**
   * Owner + a guest with two transactions, plus a control transaction for the same guest id
   * living in a different event: replacements must never leak across events.
   */
  async function seedScenario() {
    const owner = await createUser(userRepository, { email: 'owner@example.com', name: 'Owner' });
    const destination = await createUser(userRepository, { email: 'destination@example.com', name: 'Destination' });

    const createResponse = await request(httpServer())
      .post('/api/events')
      .set('Authorization', buildAuthHeader(jwtService, owner))
      .send({
        title: 'Replacement Event',
        participants: [{ type: 'guest', id: GUEST_ID, name: 'Guest One' }],
      })
      .expect(201);

    const eventId = String(getDataObjectFromBody(createResponse.body).id);

    const guestTransactions = await Promise.all([
      createTransaction(transactionRepository, {
        title: 'Guest contribution',
        paymentType: 'contribution',
        amount: 50,
        participantId: GUEST_ID,
        eventId,
      }),
      createTransaction(transactionRepository, {
        title: 'Guest expense',
        paymentType: 'expense',
        amount: 20,
        participantId: GUEST_ID,
        eventId,
      }),
    ]);

    const ownerTransaction = await createTransaction(transactionRepository, {
      title: 'Owner contribution',
      paymentType: 'contribution',
      amount: 30,
      participantId: owner.id,
      eventId,
    });

    const otherEvent = await createEvent(eventRepository, {
      title: 'Untouched Event',
      participants: [
        { type: 'user', id: owner.id },
        { type: 'guest', id: GUEST_ID, name: 'Guest One' },
      ],
    });

    const otherEventTransaction = await createTransaction(transactionRepository, {
      title: 'Guest expense in another event',
      paymentType: 'expense',
      amount: 15,
      participantId: GUEST_ID,
      eventId: otherEvent.id,
    });

    return { owner, destination, eventId, guestTransactions, ownerTransaction, otherEventTransaction };
  }

  const participantIdOf = async (transactionId: string): Promise<string | undefined> =>
    (await transactionRepository.findOne({ where: { id: transactionId } }))?.participantId;

  const participantsOf = async (eventId: string) =>
    (await eventRepository.findOne({ where: { id: eventId } }))?.participants ?? [];

  it('migrates the guest transactions to the destination user and leaves every other transaction alone', async () => {
    const { owner, destination, eventId, guestTransactions, ownerTransaction, otherEventTransaction } =
      await seedScenario();

    await request(httpServer())
      .patch(`/api/events/${eventId}`)
      .set('Authorization', buildAuthHeader(jwtService, owner))
      .send({
        participants: [
          { type: 'user', id: owner.id },
          { type: 'user', id: destination.id },
        ],
        participantReplacements: [{ fromGuestId: GUEST_ID, toUserId: destination.id }],
      })
      .expect(200);

    for (const transaction of guestTransactions) {
      await expect(participantIdOf(transaction.id)).resolves.toBe(destination.id);
    }

    await expect(participantIdOf(ownerTransaction.id)).resolves.toBe(owner.id);
    await expect(participantIdOf(otherEventTransaction.id)).resolves.toBe(GUEST_ID);

    const getResponse = await request(httpServer())
      .get(`/api/events/${eventId}`)
      .set('Authorization', buildAuthHeader(jwtService, owner))
      .expect(200);

    const participants = (getDataObjectFromBody(getResponse.body).participants ?? []) as Array<Record<string, unknown>>;

    expect(participants).not.toContainEqual(expect.objectContaining({ id: GUEST_ID }));
    expect(participants).toContainEqual(
      expect.objectContaining({ type: 'user', id: destination.id, name: 'Destination' }),
    );
  });

  it('rejects a replacement whose target user is missing from the updated participants and changes nothing', async () => {
    const { owner, destination, eventId, guestTransactions } = await seedScenario();

    const response = await request(httpServer())
      .patch(`/api/events/${eventId}`)
      .set('Authorization', buildAuthHeader(jwtService, owner))
      .send({
        participants: [{ type: 'user', id: owner.id }],
        participantReplacements: [{ fromGuestId: GUEST_ID, toUserId: destination.id }],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/api/events/${eventId}`,
      method: 'PATCH',
    });

    for (const transaction of guestTransactions) {
      await expect(participantIdOf(transaction.id)).resolves.toBe(GUEST_ID);
    }

    expect(await participantsOf(eventId)).toContainEqual(expect.objectContaining({ type: 'guest', id: GUEST_ID }));
  });

  it('rolls back the migrated transactions and the event itself when the update fails midway', async () => {
    const { owner, destination, eventId, guestTransactions } = await seedScenario();

    // There is no foreign key on participant_id, so no realistic query can fail on its own:
    // inject the failure after the real migration has already run inside the DB transaction.
    // The value read through the transactional manager proves the UPDATE did happen, so the
    // assertions below are really observing a rollback and not a migration that never ran.
    let participantIdInsideTransaction: string | undefined;

    const participantsService = app.get(EventParticipantsService);
    // `strictBindCallApply` is off in this tsconfig, so bind() widens to any: assert it back.
    const applyReplacements = participantsService.applyParticipantReplacements.bind(
      participantsService,
    ) as EventParticipantsService['applyParticipantReplacements'];

    jest
      .spyOn(participantsService, 'applyParticipantReplacements')
      .mockImplementation(async (manager, id, replacements) => {
        await applyReplacements(manager, id, replacements);

        const migrated = await manager.getRepository(Transaction).findOne({ where: { id: guestTransactions[0].id } });
        participantIdInsideTransaction = migrated?.participantId;

        throw new Error('injected failure after migration');
      });

    await request(httpServer())
      .patch(`/api/events/${eventId}`)
      .set('Authorization', buildAuthHeader(jwtService, owner))
      .send({
        participants: [
          { type: 'user', id: owner.id },
          { type: 'user', id: destination.id },
        ],
        participantReplacements: [{ fromGuestId: GUEST_ID, toUserId: destination.id }],
      })
      .expect(500);

    expect(participantIdInsideTransaction).toBe(destination.id);

    for (const transaction of guestTransactions) {
      await expect(participantIdOf(transaction.id)).resolves.toBe(GUEST_ID);
    }

    const participants = await participantsOf(eventId);
    expect(participants).toContainEqual(expect.objectContaining({ type: 'guest', id: GUEST_ID }));
    expect(participants).not.toContainEqual(expect.objectContaining({ id: destination.id }));
  });
});
