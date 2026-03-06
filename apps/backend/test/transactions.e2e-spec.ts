import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createEvent, createTransaction, createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';

describe('Transactions API (e2e)', () => {
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

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/events/:eventId/transactions returns 401 without JWT', async () => {
    const event = await createEvent(eventRepository, {
      title: 'No Auth Event',
      description: 'Auth test',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .post(`/api/events/${event.id}/transactions`)
      .send({
        title: 'Unauthorized Transaction',
        paymentType: 'expense',
        amount: 10,
        participantId: 'g1',
        date: '2026-02-25',
      })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: `/api/events/${event.id}/transactions`,
      method: 'POST',
    });
  });

  it('POST /api/events/:eventId/transactions returns 400 for invalid DTO', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-user@example.com',
      name: 'Tx User',
    });

    const event = await createEvent(eventRepository, {
      title: 'DTO Validation Event',
      description: 'DTO test',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .post(`/api/events/${event.id}/transactions`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        title: 'Invalid DTO',
        paymentType: 'expense',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/api/events/${event.id}/transactions`,
      method: 'POST',
    });
  });

  it('POST /api/events/:eventId/transactions returns 404 when event does not exist', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-notfound@example.com',
      name: 'Tx NotFound',
    });

    const missingEventId = '11111111-1111-1111-1111-111111111111';

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .post(`/api/events/${missingEventId}/transactions`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        title: 'Missing Event Transaction',
        paymentType: 'expense',
        amount: 20,
        participantId: 'g1',
        date: '2026-02-25',
      })
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/api/events/${missingEventId}/transactions`,
      method: 'POST',
    });
  });

  it('POST + GET(list) + GET(paginated) use success contract { data }', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-owner@example.com',
      name: 'Tx Owner',
    });

    const event = await createEvent(eventRepository, {
      title: 'Transaction Contract Event',
      description: 'Contract test',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const createResponse = await request(httpServer)
      .post(`/api/events/${event.id}/transactions`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        title: 'Dinner',
        paymentType: 'expense',
        amount: 33.5,
        participantId: 'g1',
        date: '2026-02-25',
      })
      .expect(201);

    const createData = getDataObjectFromBody(createResponse.body);
    expect(createData).toMatchObject({
      title: 'Dinner',
      paymentType: 'expense',
      participantId: 'g1',
      eventId: event.id,
    });

    const listResponse = await request(httpServer)
      .get(`/api/events/${event.id}/transactions`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(200);

    const listData = getDataFromBody(listResponse.body);
    expect(Array.isArray(listData)).toBe(true);
    const list = listData as unknown[];
    expect(list).toHaveLength(1);

    const paginatedResponse = await request(httpServer)
      .get(`/api/events/${event.id}/transactions/paginated?numberOfDates=3&offset=0`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(200);

    const paginatedData = getDataObjectFromBody(paginatedResponse.body);
    expect(paginatedData).toMatchObject({
      hasMore: false,
      totalDates: 1,
      loadedDates: 1,
    });
    expect(Array.isArray((paginatedData as { transactions?: unknown }).transactions)).toBe(true);
  });

  it('GET /api/events/:eventId/transactions/paginated returns 400 for invalid query params', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-query@example.com',
      name: 'Tx Query',
    });

    const event = await createEvent(eventRepository, {
      title: 'Pagination Validation Event',
      description: 'Pagination test',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .get(`/api/events/${event.id}/transactions/paginated?numberOfDates=0&offset=-1`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/api/events/${event.id}/transactions/paginated?numberOfDates=0&offset=-1`,
      method: 'GET',
    });
  });

  it('GET /api/transactions/:id returns transaction in { data } contract', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-single-get@example.com',
      name: 'Tx Single Get',
    });

    const event = await createEvent(eventRepository, {
      title: 'Single Tx Event',
      description: 'Single tx read',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const created = await createTransaction(transactionRepository, {
      title: 'Taxi',
      paymentType: 'expense',
      amount: 18,
      participantId: 'g1',
      eventId: event.id,
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .get(`/api/transactions/${created.id}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(200);

    const data = getDataObjectFromBody(response.body);
    expect(data).toMatchObject({
      id: created.id,
      title: 'Taxi',
      eventId: event.id,
      participantId: 'g1',
    });
  });

  it('GET /api/transactions/:id returns 404 for non-existing transaction', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-single-404@example.com',
      name: 'Tx Single 404',
    });

    const missingId = '22222222-2222-2222-2222-222222222222';
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get(`/api/transactions/${missingId}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/api/transactions/${missingId}`,
      method: 'GET',
    });
  });

  it('PATCH /api/transactions/:id updates transaction and keeps { data } contract', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-patch@example.com',
      name: 'Tx Patch',
    });

    const event = await createEvent(eventRepository, {
      title: 'Patch Tx Event',
      description: 'Patch tx',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const created = await createTransaction(transactionRepository, {
      title: 'Museum',
      paymentType: 'expense',
      amount: 15,
      participantId: 'g1',
      eventId: event.id,
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .patch(`/api/transactions/${created.id}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        title: 'Museum Updated',
        amount: 21,
      })
      .expect(200);

    const data = getDataObjectFromBody(response.body);
    expect(data).toMatchObject({
      id: created.id,
      title: 'Museum Updated',
    });
    expect(Number(data.amount)).toBe(21);
  });

  it('PATCH /api/transactions/:id returns 404 for non-existing transaction', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-patch-404@example.com',
      name: 'Tx Patch 404',
    });

    const missingId = '33333333-3333-3333-3333-333333333333';
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .patch(`/api/transactions/${missingId}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({ title: 'No tx' })
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/api/transactions/${missingId}`,
      method: 'PATCH',
    });
  });

  it('DELETE /api/transactions/:id returns 204 with empty body', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-delete@example.com',
      name: 'Tx Delete',
    });

    const event = await createEvent(eventRepository, {
      title: 'Delete Tx Event',
      description: 'Delete tx',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const created = await createTransaction(transactionRepository, {
      title: 'Coffee',
      paymentType: 'expense',
      amount: 4,
      participantId: 'g1',
      eventId: event.id,
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .delete(`/api/transactions/${created.id}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(204);

    expect(response.text).toBe('');
  });

  it('DELETE /api/transactions/:id returns 404 for non-existing transaction', async () => {
    const user = await createUser(userRepository, {
      email: 'tx-delete-404@example.com',
      name: 'Tx Delete 404',
    });

    const missingId = '44444444-4444-4444-4444-444444444444';
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .delete(`/api/transactions/${missingId}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/api/transactions/${missingId}`,
      method: 'DELETE',
    });
  });

  it('GET /api/transactions/:id returns 401 without JWT', async () => {
    const event = await createEvent(eventRepository, {
      title: 'No Auth Single Tx Event',
      description: 'No auth single tx',
      status: EventStatus.ACTIVE,
      participants: [{ type: 'guest', id: 'g1', name: 'Guest 1' }],
    });

    const created = await createTransaction(transactionRepository, {
      title: 'No Auth Tx',
      paymentType: 'expense',
      amount: 9,
      participantId: 'g1',
      eventId: event.id,
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer).get(`/api/transactions/${created.id}`).expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: `/api/transactions/${created.id}`,
      method: 'GET',
    });
  });

  it('returns 404 for user not participating in event transactions while admin keeps global access', async () => {
    const owner = await createUser(userRepository, {
      email: 'tx-owner-access@example.com',
      name: 'Tx Owner Access',
    });
    const outsider = await createUser(userRepository, {
      email: 'tx-outsider-access@example.com',
      name: 'Tx Outsider Access',
    });
    const admin = await createUser(userRepository, {
      email: 'tx-admin-access@example.com',
      name: 'Tx Admin Access',
      role: 'admin',
    });

    const event = await createEvent(eventRepository, {
      title: 'Restricted Transaction Event',
      description: 'Restricted tx access',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: owner.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });

    const transaction = await createTransaction(transactionRepository, {
      title: 'Owner Expense',
      paymentType: 'expense',
      amount: 55,
      participantId: 'g1',
      eventId: event.id,
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    await request(httpServer)
      .get(`/api/events/${event.id}/transactions`)
      .set('Authorization', buildAuthHeader(jwtService, outsider))
      .expect(404);

    await request(httpServer)
      .post(`/api/events/${event.id}/transactions`)
      .set('Authorization', buildAuthHeader(jwtService, outsider))
      .send({
        title: 'Outsider Attempt',
        paymentType: 'expense',
        amount: 10,
        participantId: 'g1',
        date: '2026-03-01',
      })
      .expect(404);

    await request(httpServer)
      .get(`/api/transactions/${transaction.id}`)
      .set('Authorization', buildAuthHeader(jwtService, outsider))
      .expect(404);

    await request(httpServer)
      .get(`/api/transactions/${transaction.id}`)
      .set('Authorization', buildAuthHeader(jwtService, admin))
      .expect(200);
  });
});
