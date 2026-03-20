import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createUser } from './utils/test-factories';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/auth/me should return 401 when no token is provided', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer).get('/api/auth/me').expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/api/auth/me',
      method: 'GET',
    });
  });

  it('GET /api/auth/me should return the authenticated user with a valid JWT', async () => {
    const user = await createUser(userRepository, {
      email: 'john.doe@example.com',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.png',
    });

    const token = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

    const responseBody = response.body as {
      data: {
        id: string;
        email: string;
        name: string;
        avatar: string;
        role: string;
        createdAt: unknown;
        updatedAt: unknown;
      };
    };

    expect(responseBody).toMatchObject({
      data: {
        id: user.id,
        email: 'john.doe@example.com',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.png',
        role: 'user',
      },
    });

    expect(typeof responseBody.data.createdAt).toBe('string');
    expect(typeof responseBody.data.updatedAt).toBe('string');
  });
});
