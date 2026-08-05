import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody } from './utils/test-http-helpers';

/**
 * The `400` responses only exist at the HTTP level: they are produced by the global ValidationPipe,
 * so they cannot be exercised by calling the controller directly.
 */
describe('Users Search API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let authHeader: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    jwtService = app.get(JwtService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await userRepository.createQueryBuilder().delete().from(User).execute();

    const searcher = await createUser(userRepository, {
      email: 'searcher@test.com',
      name: 'Searcher',
    });
    authHeader = buildAuthHeader(jwtService, searcher);
  });

  afterAll(async () => {
    await app.close();
  });

  const getHttpServer = () => app.getHttpServer() as Parameters<typeof request>[0];

  it.each([
    ['a missing query', '/api/users/search'],
    ['an empty query', '/api/users/search?q='],
    ['a whitespace-only query', '/api/users/search?q=%20%20'],
    ['a query below the minimum length', '/api/users/search?q=a'],
    ['a query above the maximum length', `/api/users/search?q=${'a'.repeat(101)}`],
  ])('returns 400 for %s', async (_description, url) => {
    const response = await request(getHttpServer()).get(url).set('Authorization', authHeader).expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      method: 'GET',
    });
  });

  it('returns 400 for unknown query parameters', async () => {
    await request(getHttpServer())
      .get('/api/users/search?q=ana&limit=100')
      .set('Authorization', authHeader)
      .expect(400);
  });

  it('returns 401 without a token', async () => {
    await request(getHttpServer()).get('/api/users/search?q=ana').expect(401);
  });

  it('returns the matching users for a valid query', async () => {
    await createUser(userRepository, { email: 'ana@test.com', name: 'Ana' });
    await createUser(userRepository, { email: 'bruno@test.com', name: 'Bruno' });

    const response = await request(getHttpServer())
      .get('/api/users/search?q=an')
      .set('Authorization', authHeader)
      .expect(200);

    const data = getDataFromBody(response.body) as { name: string }[];
    expect(data.map((user) => user.name)).toEqual(['Ana']);
  });

  it('trims the query before searching', async () => {
    await createUser(userRepository, { email: 'ana@test.com', name: 'Ana' });

    const response = await request(getHttpServer())
      .get('/api/users/search?q=%20ana%20')
      .set('Authorization', authHeader)
      .expect(200);

    const data = getDataFromBody(response.body) as { name: string }[];
    expect(data.map((user) => user.name)).toEqual(['Ana']);
  });

  it('does not interpret wildcards in the query', async () => {
    await createUser(userRepository, { email: 'ana@test.com', name: 'Ana' });
    await createUser(userRepository, { email: 'bruno@test.com', name: 'Bruno' });

    const response = await request(getHttpServer())
      .get('/api/users/search?q=%25%25')
      .set('Authorization', authHeader)
      .expect(200);

    expect(getDataFromBody(response.body)).toEqual([]);
  });
});
