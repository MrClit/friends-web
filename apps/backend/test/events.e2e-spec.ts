/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { EventsModule } from '../src/modules/events/events.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let createdEventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
          username: process.env.DATABASE_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || 'friends_test',
          entities: [Event],
          synchronize: true, // Only for tests
          dropSchema: true, // Clean database before each test run
        }),
        EventsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes, filters, and interceptors (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/events', () => {
    it('should create a new event', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'Test Event',
          participants: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Event');
          expect(res.body.participants).toHaveLength(2);
          expect(res.body.participants[0].name).toBe('Alice');
          createdEventId = res.body.id; // Save for later tests
        });
    });

    it('should return 400 when title is missing', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          participants: [{ id: '1', name: 'Alice' }],
        })
        .expect(400);
    });

    it('should return 400 when participants is empty', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'Test Event',
          participants: [],
        })
        .expect(400);
    });

    it('should return 400 when participants have invalid structure', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'Test Event',
          participants: [{ id: '1' }], // Missing name
        })
        .expect(400);
    });
  });

  describe('GET /api/events', () => {
    it('should return an array of events', () => {
      return request(app.getHttpServer())
        .get('/api/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return an event by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdEventId);
          expect(res.body.title).toBe('Test Event');
        });
    });

    it('should return 404 when event not found', () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer())
        .get(`/api/events/${nonExistentId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('should return 400 when ID is not a valid UUID', () => {
      return request(app.getHttpServer())
        .get('/api/events/invalid-id')
        .expect(400);
    });
  });

  describe('PATCH /api/events/:id', () => {
    it('should update an event title', () => {
      return request(app.getHttpServer())
        .patch(`/api/events/${createdEventId}`)
        .send({
          title: 'Updated Event',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdEventId);
          expect(res.body.title).toBe('Updated Event');
        });
    });

    it('should update event participants', () => {
      return request(app.getHttpServer())
        .patch(`/api/events/${createdEventId}`)
        .send({
          participants: [
            { id: '1', name: 'Alice' },
            { id: '3', name: 'Charlie' },
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.participants).toHaveLength(2);
          expect(res.body.participants[1].name).toBe('Charlie');
        });
    });

    it('should return 404 when updating non-existent event', () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer())
        .patch(`/api/events/${nonExistentId}`)
        .send({
          title: 'Updated',
        })
        .expect(404);
    });

    it('should return 400 when participants array is empty', () => {
      return request(app.getHttpServer())
        .patch(`/api/events/${createdEventId}`)
        .send({
          participants: [],
        })
        .expect(400);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', () => {
      return request(app.getHttpServer())
        .delete(`/api/events/${createdEventId}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent event', () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer())
        .delete(`/api/events/${nonExistentId}`)
        .expect(404);
    });

    it('should verify event is deleted', () => {
      return request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(404);
    });
  });

  describe('Integration: Full CRUD Flow', () => {
    it('should complete full CRUD lifecycle', async () => {
      // 1. Create
      const createRes = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'CRUD Test Event',
          participants: [{ id: '1', name: 'Alice' }],
        })
        .expect(201);

      const eventId = createRes.body.id;

      // 2. Read (Get by ID)
      await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('CRUD Test Event');
        });

      // 3. Update
      await request(app.getHttpServer())
        .patch(`/api/events/${eventId}`)
        .send({
          title: 'Updated CRUD Event',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated CRUD Event');
        });

      // 4. Delete
      await request(app.getHttpServer())
        .delete(`/api/events/${eventId}`)
        .expect(204);

      // 5. Verify deletion
      await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .expect(404);
    });
  });
});
