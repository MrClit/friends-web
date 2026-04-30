import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RefreshToken } from '../src/modules/auth/entities/refresh-token.entity';
import { RefreshTokenService } from '../src/modules/auth/services/refresh-token.service';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';
import { createUser } from './utils/test-factories';

describe('Auth access control (integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let refreshTokenService: RefreshTokenService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = app.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    refreshTokenService = app.get(RefreshTokenService);
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await refreshTokenRepository.createQueryBuilder().delete().from(RefreshToken).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/refresh', () => {
    it('returns new accessToken and refreshToken for a valid token', async () => {
      const user = await createUser(userRepository, { email: 'refresh@test.com', name: 'Refresh User' });
      const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);

      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const response = await request(httpServer)
        .post('/api/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(201);

      const data = getDataObjectFromBody(response.body);
      expect(typeof data.accessToken).toBe('string');
      expect(typeof data.refreshToken).toBe('string');
      expect(data.refreshToken).not.toBe(rawToken);
    });

    it('returns 401 when the refreshToken field is absent', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer).post('/api/auth/refresh').send({}).expect(401);
    });

    it('returns 401 for a revoked token', async () => {
      const user = await createUser(userRepository, { email: 'revoked@test.com', name: 'Revoked User' });
      const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);
      await refreshTokenService.revokeByRawToken(rawToken);

      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .post('/api/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(401);
    });

    it('returns 401 when the user has been soft-deleted after the token was issued', async () => {
      const user = await createUser(userRepository, { email: 'softdeleted@test.com', name: 'Deleted User' });
      const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);
      await userRepository.softDelete(user.id);

      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .post('/api/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes the refresh token so subsequent refresh attempts return 401', async () => {
      const user = await createUser(userRepository, { email: 'logout@test.com', name: 'Logout User' });
      const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);

      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

      await request(httpServer)
        .post('/api/auth/logout')
        .set('Authorization', buildAuthHeader(jwtService, user))
        .send({ refreshToken: rawToken })
        .expect(201);

      await request(httpServer)
        .post('/api/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(401);
    });
  });

  describe('GET /api/admin/users — role escalation', () => {
    it('returns 403 when a regular user attempts to access the admin endpoint', async () => {
      const user = await createUser(userRepository, {
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
      });

      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .get('/api/admin/users')
        .set('Authorization', buildAuthHeader(jwtService, user))
        .expect(403);
    });

    it('returns 200 when an admin user accesses the admin endpoint', async () => {
      const admin = await createUser(userRepository, {
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
      });

      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const response = await request(httpServer)
        .get('/api/admin/users')
        .set('Authorization', buildAuthHeader(jwtService, admin))
        .expect(200);

      const data = getDataFromBody(response.body);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('GET /api/auth/google/callback — OAuth callback mock', () => {
    let oauthApp: INestApplication;
    let oauthUserRepository: Repository<User>;
    let oauthRefreshTokenRepository: Repository<RefreshToken>;
    let testUser: User;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideGuard(AuthGuard('google'))
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest<{ user: User }>();
            req.user = testUser;
            return true;
          },
        })
        .compile();

      oauthApp = moduleFixture.createNestApplication();
      applyAppTestConfig(oauthApp);
      await oauthApp.init();

      oauthUserRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
      oauthRefreshTokenRepository = moduleFixture.get<Repository<RefreshToken>>(
        getRepositoryToken(RefreshToken),
      );
    });

    beforeEach(async () => {
      await oauthRefreshTokenRepository.createQueryBuilder().delete().from(RefreshToken).execute();
      await oauthUserRepository.createQueryBuilder().delete().from(User).execute();
      testUser = await createUser(oauthUserRepository, { email: 'oauth@test.com', name: 'OAuth User' });
    });

    afterAll(async () => {
      await oauthApp.close();
    });

    it('redirects to the frontend callback URL with success=true and a refreshToken', async () => {
      const httpServer = oauthApp.getHttpServer() as Parameters<typeof request>[0];
      const response = await request(httpServer).get('/api/auth/google/callback').expect(302);

      expect(response.headers.location).toContain('/auth/callback');
      expect(response.headers.location).toContain('success=true');
      expect(response.headers.location).toContain('refreshToken=');
    });
  });
});
