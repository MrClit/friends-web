import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppTestConfig } from './utils/test-app-config';

describe('Security headers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Assertions check for presence and meaningful substrings rather than exact header values:
  // helmet changes its defaults across major versions, and a literal match would break on every
  // bump without signalling a real regression.
  it('sends helmet security headers on API responses', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer).get('/api/health/live').expect(200);

    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['content-security-policy']).toContain("script-src 'self'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['strict-transport-security']).toContain('max-age=');
    expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('does not disclose the underlying framework', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer).get('/api/health/live').expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
