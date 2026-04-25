import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';

describe('Events API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let eventRepository: Repository<Event>;

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
  });

  beforeEach(async () => {
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/events returns 401 without JWT and uses error contract', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer).get('/api/events').expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/api/events',
      method: 'GET',
    });
  });

  it('POST /api/events returns 400 for invalid payload and uses error contract', async () => {
    const user = await createUser(userRepository, {
      email: 'events-user@example.com',
      name: 'Events User',
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .post('/api/events')
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        participants: [],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/api/events',
      method: 'POST',
    });
  });

  describe('POST /api/events - participant DTO validation', () => {
    let validationUser: Awaited<ReturnType<typeof createUser>>;
    let httpServer: Parameters<typeof request>[0];

    beforeEach(async () => {
      validationUser = await createUser(userRepository, {
        email: `participant-validation-${Date.now()}@example.com`,
        name: 'Validation User',
      });
      httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    });

    const postEvent = (participants: unknown[]) =>
      request(httpServer)
        .post('/api/events')
        .set('Authorization', buildAuthHeader(jwtService, validationUser))
        .send({ title: 'Validation Test', participants });

    it('returns 400 for unknown participant type', async () => {
      const response = await postEvent([{ type: 'invalid', id: 'x' }]).expect(400);
      expect(response.body).toMatchObject({ statusCode: 400, path: '/api/events', method: 'POST' });
    });

    it('returns 400 for guest missing name', async () => {
      const response = await postEvent([{ type: 'guest', id: 'g-x' }]).expect(400);
      expect(response.body).toMatchObject({ statusCode: 400, path: '/api/events', method: 'POST' });
    });

    it('returns 400 for user missing id', async () => {
      const response = await postEvent([{ type: 'user' }]).expect(400);
      expect(response.body).toMatchObject({ statusCode: 400, path: '/api/events', method: 'POST' });
    });

    it('returns 400 for negative contributionTarget on user', async () => {
      const response = await postEvent([{ type: 'user', id: 'u-1', contributionTarget: -50 }]).expect(400);
      expect(response.body).toMatchObject({ statusCode: 400, path: '/api/events', method: 'POST' });
    });

    it('returns 400 for negative contributionTarget on guest', async () => {
      const response = await postEvent([{ type: 'guest', id: 'g-1', name: 'Alice', contributionTarget: -1 }]).expect(400);
      expect(response.body).toMatchObject({ statusCode: 400, path: '/api/events', method: 'POST' });
    });
  });

  it('POST /api/events and GET /api/events/:id use success contract { data }', async () => {
    const user = await createUser(userRepository, {
      email: 'events-owner@example.com',
      name: 'Events Owner',
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const createResponse = await request(httpServer)
      .post('/api/events')
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        title: 'E2E Event',
        participants: [{ type: 'guest', id: 'g-1', name: 'Guest One' }],
      })
      .expect(201);

    const createData = getDataObjectFromBody(createResponse.body);
    expect(createData).toMatchObject({
      title: 'E2E Event',
    });

    const eventId = String(createData.id);

    const getResponse = await request(httpServer)
      .get(`/api/events/${eventId}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(200);

    const getData = getDataObjectFromBody(getResponse.body);
    expect(getData).toMatchObject({
      id: eventId,
      title: 'E2E Event',
    });
  });

  it('GET /api/events/:id returns 404 for non-existing event and keeps error contract', async () => {
    const user = await createUser(userRepository, {
      email: 'events-reader@example.com',
      name: 'Events Reader',
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .get('/api/events/11111111-1111-1111-1111-111111111111')
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/api/events/11111111-1111-1111-1111-111111111111',
      method: 'GET',
    });
  });

  it('GET /api/events returns all events for admin and only participant events for user', async () => {
    const admin = await createUser(userRepository, {
      email: 'events-admin@example.com',
      name: 'Events Admin',
      role: 'admin',
    });
    const userA = await createUser(userRepository, {
      email: 'events-user-a@example.com',
      name: 'Events User A',
    });
    const userB = await createUser(userRepository, {
      email: 'events-user-b@example.com',
      name: 'Events User B',
    });

    const userAEvent = await eventRepository.save({
      title: 'User A Event',
      participants: [{ type: 'user', id: userA.id }],
    });

    const userBEvent = await eventRepository.save({
      title: 'User B Event',
      participants: [{ type: 'user', id: userB.id }],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const userResponse = await request(httpServer)
      .get('/api/events')
      .set('Authorization', buildAuthHeader(jwtService, userA))
      .expect(200);

    const userEvents = getDataFromBody(userResponse.body) as Array<Record<string, unknown>>;
    expect(userEvents).toHaveLength(1);
    expect(userEvents[0].id).toBe(userAEvent.id);

    const adminResponse = await request(httpServer)
      .get('/api/events')
      .set('Authorization', buildAuthHeader(jwtService, admin))
      .expect(200);

    const adminEvents = getDataFromBody(adminResponse.body) as Array<Record<string, unknown>>;
    const adminEventIds = adminEvents.map((event) => String(event.id));
    expect(adminEventIds).toEqual(expect.arrayContaining([userAEvent.id, userBEvent.id]));
  });

  it('GET /api/events/:id returns 403 when user is not a participant', async () => {
    const userA = await createUser(userRepository, {
      email: 'events-user-access-a@example.com',
      name: 'Events User Access A',
    });
    const userB = await createUser(userRepository, {
      email: 'events-user-access-b@example.com',
      name: 'Events User Access B',
    });

    const event = await eventRepository.save({
      title: 'Restricted Event',
      participants: [{ type: 'user', id: userB.id }],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .get(`/api/events/${event.id}`)
      .set('Authorization', buildAuthHeader(jwtService, userA))
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      path: `/api/events/${event.id}`,
      method: 'GET',
    });
  });

  it('POST /api/events auto-adds current user as participant when missing', async () => {
    const user = await createUser(userRepository, {
      email: 'events-auto-participant@example.com',
      name: 'Auto Participant User',
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const createResponse = await request(httpServer)
      .post('/api/events')
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        title: 'Auto Participant Event',
        participants: [{ type: 'guest', id: 'g-100', name: 'Guest 100' }],
      })
      .expect(201);

    const createData = getDataObjectFromBody(createResponse.body);
    const participants = (createData.participants ?? []) as Array<Record<string, unknown>>;

    expect(participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'guest', id: 'g-100' }),
        expect.objectContaining({ type: 'user', id: user.id }),
      ]),
    );
  });

  it('PATCH /api/events/:id allows user self-removal and access is revoked afterwards', async () => {
    const user = await createUser(userRepository, {
      email: 'events-self-removal@example.com',
      name: 'Self Removal User',
    });

    const event = await eventRepository.save({
      title: 'Self Removal Event',
      participants: [
        { type: 'user', id: user.id },
        { type: 'guest', id: 'g-200', name: 'Guest 200' },
      ],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    await request(httpServer)
      .patch(`/api/events/${event.id}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .send({
        participants: [{ type: 'guest', id: 'g-200', name: 'Guest 200' }],
      })
      .expect(200);

    await request(httpServer)
      .get(`/api/events/${event.id}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(403);
  });

  it('GET /api/events/:id/kpis returns 403 when user is not a participant', async () => {
    const userA = await createUser(userRepository, {
      email: 'events-kpi-access-a@example.com',
      name: 'KPI Access User A',
    });
    const userB = await createUser(userRepository, {
      email: 'events-kpi-access-b@example.com',
      name: 'KPI Access User B',
    });

    const event = await eventRepository.save({
      title: 'KPI Restricted Event',
      participants: [{ type: 'user', id: userB.id }],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer)
      .get(`/api/events/${event.id}/kpis`)
      .set('Authorization', buildAuthHeader(jwtService, userA))
      .expect(403);
  });
});
