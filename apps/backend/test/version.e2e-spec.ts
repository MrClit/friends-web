import { readFileSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppTestConfig } from './utils/test-app-config';

describe('Version (e2e)', () => {
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

  it('serves the root package.json version without authentication', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const rootManifest = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf8')) as {
      version: string;
    };

    const response = await request(httpServer).get('/api/version').expect(200);

    expect(response.body).toEqual({
      data: { version: rootManifest.version, commit: expect.any(String) as string },
    });
  });
});
