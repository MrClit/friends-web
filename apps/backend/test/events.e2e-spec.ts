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
import { buildAuthHeader, getDataObjectFromBody } from './utils/test-http-helpers';

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
});
