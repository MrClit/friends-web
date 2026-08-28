import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event, EventStatus } from '../src/modules/events/entities/event.entity';
import { ShoppingItem } from '../src/modules/shopping-list/entities/shopping-item.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { createEvent, createShoppingItem, createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';

describe('Shopping items API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let eventRepository: Repository<Event>;
  let shoppingItemRepository: Repository<ShoppingItem>;

  let member: User;
  let otherMember: User;
  let outsider: User;
  let admin: User;
  let event: Event;

  const httpServer = () => app.getHttpServer() as Parameters<typeof request>[0];

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
    shoppingItemRepository = app.get<Repository<ShoppingItem>>(getRepositoryToken(ShoppingItem));
  });

  beforeEach(async () => {
    await shoppingItemRepository.createQueryBuilder().delete().from(ShoppingItem).execute();
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();

    member = await createUser(userRepository, { email: 'member@example.com', name: 'Member' });
    otherMember = await createUser(userRepository, { email: 'other@example.com', name: 'Other Member' });
    outsider = await createUser(userRepository, { email: 'outsider@example.com', name: 'Outsider' });
    admin = await createUser(userRepository, { email: 'admin@example.com', name: 'Admin', role: 'admin' });

    event = await createEvent(eventRepository, {
      title: 'Shopping Event',
      status: EventStatus.ACTIVE,
      participants: [
        { type: 'user', id: member.id },
        { type: 'user', id: otherMember.id },
        { type: 'guest', id: 'g1', name: 'Guest 1' },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/events/:eventId/shopping-items', () => {
    it('returns 401 without a JWT', async () => {
      const response = await request(httpServer()).get(`/api/events/${event.id}/shopping-items`).expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        path: `/api/events/${event.id}/shopping-items`,
        method: 'GET',
      });
    });

    it('returns the list of the event in insertion order', async () => {
      const first = await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });
      const second = await createShoppingItem(shoppingItemRepository, { name: 'Hielo', eventId: event.id });

      const response = await request(httpServer())
        .get(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(200);

      const data = getDataFromBody(response.body) as Array<{ id: string }>;
      expect(data.map((item) => item.id)).toEqual([first.id, second.id]);
    });

    it('does not leak the items of another event', async () => {
      const otherEvent = await createEvent(eventRepository, {
        title: 'Other Event',
        participants: [{ type: 'user', id: member.id }],
      });
      await createShoppingItem(shoppingItemRepository, { name: 'Vino', eventId: otherEvent.id });

      const response = await request(httpServer())
        .get(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(200);

      expect(getDataFromBody(response.body)).toEqual([]);
    });

    it('returns 404 for an unknown event and 400 for a malformed id', async () => {
      await request(httpServer())
        .get('/api/events/0f2b7e3a-4c5d-4e6f-8a9b-0c1d2e3f4a5b/shopping-items')
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(404);

      await request(httpServer())
        .get('/api/events/not-a-uuid/shopping-items')
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(400);
    });

    it('returns 403 for a non-participant and 200 for an admin that does not participate', async () => {
      await request(httpServer())
        .get(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .expect(403);

      await request(httpServer())
        .get(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, admin))
        .expect(200);
    });
  });

  describe('POST /api/events/:eventId/shopping-items', () => {
    it('creates the item, attributes it to the caller and leaves it pending', async () => {
      const response = await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ name: '2 cajas de cerveza' })
        .expect(201);

      const data = getDataObjectFromBody(response.body);
      expect(data).toMatchObject({
        name: '2 cajas de cerveza',
        eventId: event.id,
        createdBy: member.id,
        purchasedBy: null,
        purchasedAt: null,
      });
    });

    it('trims the surrounding whitespace of the name', async () => {
      const response = await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ name: '   Pan   ' })
        .expect(201);

      expect(getDataObjectFromBody(response.body).name).toBe('Pan');
    });

    it('rejects a missing, empty, whitespace-only or too long name', async () => {
      const auth = buildAuthHeader(jwtService, member);

      await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', auth)
        .send({})
        .expect(400);

      await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', auth)
        .send({ name: '' })
        .expect(400);

      await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', auth)
        .send({ name: '     ' })
        .expect(400);

      await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', auth)
        .send({ name: 'a'.repeat(121) })
        .expect(400);
    });

    // An item is one text field on purpose. This pins that contract: a client sending a structured
    // quantity gets a 400 from forbidNonWhitelisted instead of having it silently stripped.
    it('rejects a quantity field', async () => {
      await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ name: 'Cerveza', quantity: 2 })
        .expect(400);
    });

    it('returns 403 for a non-participant', async () => {
      await request(httpServer())
        .post(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .send({ name: 'Pan' })
        .expect(403);
    });
  });

  describe('PATCH /api/shopping-items/:id', () => {
    it('lets a participant rename an item created by somebody else', async () => {
      const item = await createShoppingItem(shoppingItemRepository, {
        name: 'Pan',
        eventId: event.id,
        createdBy: member.id,
      });

      const response = await request(httpServer())
        .patch(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, otherMember))
        .send({ name: '2 barras de pan' })
        .expect(200);

      expect(getDataObjectFromBody(response.body).name).toBe('2 barras de pan');
    });

    it('marks an item as purchased and back as pending', async () => {
      const item = await createShoppingItem(shoppingItemRepository, { name: 'Hielo', eventId: event.id });

      const purchased = await request(httpServer())
        .patch(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, otherMember))
        .send({ purchased: true })
        .expect(200);

      const purchasedData = getDataObjectFromBody(purchased.body);
      expect(purchasedData.purchasedBy).toBe(otherMember.id);
      expect(purchasedData.purchasedAt).not.toBeNull();

      const pending = await request(httpServer())
        .patch(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ purchased: false })
        .expect(200);

      expect(getDataObjectFromBody(pending.body)).toMatchObject({
        purchasedBy: null,
        purchasedAt: null,
      });
    });

    it('rejects a client-supplied purchase attribution', async () => {
      const item = await createShoppingItem(shoppingItemRepository, { name: 'Hielo', eventId: event.id });

      await request(httpServer())
        .patch(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ purchasedBy: outsider.id })
        .expect(400);

      await request(httpServer())
        .patch(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ purchasedAt: new Date().toISOString() })
        .expect(400);
    });

    it('returns 404 for an unknown item and 403 for a non-participant', async () => {
      const item = await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });

      await request(httpServer())
        .patch('/api/shopping-items/0f2b7e3a-4c5d-4e6f-8a9b-0c1d2e3f4a5b')
        .set('Authorization', buildAuthHeader(jwtService, member))
        .send({ name: 'Pan' })
        .expect(404);

      await request(httpServer())
        .patch(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .send({ name: 'Pan' })
        .expect(403);
    });
  });

  describe('DELETE /api/shopping-items/:id', () => {
    it('deletes an item created by somebody else and empties the response body', async () => {
      const item = await createShoppingItem(shoppingItemRepository, {
        name: 'Pan',
        eventId: event.id,
        createdBy: member.id,
      });

      const response = await request(httpServer())
        .delete(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, otherMember))
        .expect(204);

      expect(response.body).toEqual({});

      const list = await request(httpServer())
        .get(`/api/events/${event.id}/shopping-items`)
        .set('Authorization', buildAuthHeader(jwtService, member))
        .expect(200);
      expect(getDataFromBody(list.body)).toEqual([]);
    });

    it('returns 404 when deleting the same item twice', async () => {
      const item = await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });
      const auth = buildAuthHeader(jwtService, member);

      await request(httpServer()).delete(`/api/shopping-items/${item.id}`).set('Authorization', auth).expect(204);
      await request(httpServer()).delete(`/api/shopping-items/${item.id}`).set('Authorization', auth).expect(404);
    });

    it('returns 403 for a non-participant', async () => {
      const item = await createShoppingItem(shoppingItemRepository, { name: 'Pan', eventId: event.id });

      await request(httpServer())
        .delete(`/api/shopping-items/${item.id}`)
        .set('Authorization', buildAuthHeader(jwtService, outsider))
        .expect(403);
    });
  });

  // Archiving an event does not freeze its transactions today, and the shopping list follows the same
  // rule: a read-only mode for archived events would be a global decision, not a rule of this module.
  it('keeps the list editable on an archived event', async () => {
    const archivedEvent = await createEvent(eventRepository, {
      title: 'Archived Event',
      status: EventStatus.ARCHIVED,
      participants: [{ type: 'user', id: member.id }],
    });
    const auth = buildAuthHeader(jwtService, member);

    const created = await request(httpServer())
      .post(`/api/events/${archivedEvent.id}/shopping-items`)
      .set('Authorization', auth)
      .send({ name: 'Pan' })
      .expect(201);

    const itemId = getDataObjectFromBody(created.body).id as string;

    await request(httpServer())
      .patch(`/api/shopping-items/${itemId}`)
      .set('Authorization', auth)
      .send({ purchased: true })
      .expect(200);

    await request(httpServer()).delete(`/api/shopping-items/${itemId}`).set('Authorization', auth).expect(204);
  });
});
