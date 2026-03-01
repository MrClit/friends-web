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

describe('Admin Users API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/admin/users returns 401 without token', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer).get('/api/admin/users').expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/api/admin/users',
      method: 'GET',
    });
  });

  it('GET /api/admin/users returns 403 for non-admin users', async () => {
    const standardUser = await createUser(userRepository, {
      email: 'user@test.com',
      name: 'Standard User',
      role: 'user',
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/api/admin/users')
      .set('Authorization', buildAuthHeader(jwtService, standardUser))
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      path: '/api/admin/users',
      method: 'GET',
    });
  });

  it('GET /api/admin/users returns users list for admin users', async () => {
    const adminUser = await createUser(userRepository, {
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
    });

    await createUser(userRepository, {
      email: 'member@test.com',
      name: 'Member User',
      role: 'user',
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/api/admin/users')
      .set('Authorization', buildAuthHeader(jwtService, adminUser))
      .expect(200);

    const data = getDataFromBody(response.body);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'admin@test.com',
          role: 'admin',
        }),
        expect.objectContaining({
          email: 'member@test.com',
          role: 'user',
        }),
      ]),
    );
  });
});
