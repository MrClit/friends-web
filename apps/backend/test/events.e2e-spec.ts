import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { User } from '../src/modules/users/user.entity';
import { Group } from '../src/modules/groups/entities/group.entity';
import { GroupMember } from '../src/modules/groups/entities/group-member.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { addGroupMember, createEvent, createGroup, createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';

describe('Events API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let eventRepository: Repository<Event>;
  let groupRepository: Repository<Group>;
  let memberRepository: Repository<GroupMember>;

  /** A group with the given users as members. */
  const groupOf = async (...users: User[]): Promise<Group> => {
    const group = await createGroup(groupRepository, `Group ${Date.now()}-${Math.random()}`);
    for (const user of users) {
      await addGroupMember(memberRepository, group.id, user.id);
    }
    return group;
  };

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
    groupRepository = app.get<Repository<Group>>(getRepositoryToken(Group));
    memberRepository = app.get<Repository<GroupMember>>(getRepositoryToken(GroupMember));
  });

  beforeEach(async () => {
    // Events first: they restrict the delete of their group. Memberships go with the groups.
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
    await groupRepository.createQueryBuilder().delete().from(Group).execute();
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
    let validationGroup: Group;
    let httpServer: Parameters<typeof request>[0];

    beforeEach(async () => {
      validationUser = await createUser(userRepository, {
        email: `participant-validation-${Date.now()}@example.com`,
        name: 'Validation User',
      });
      // A group the user belongs to, so each case fails on its participant and not on the group.
      validationGroup = await groupOf(validationUser);
      httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    });

    const postEvent = (participants: unknown[]) =>
      request(httpServer)
        .post('/api/events')
        .set('Authorization', buildAuthHeader(jwtService, validationUser))
        .send({ groupId: validationGroup.id, title: 'Validation Test', participants });

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
      const response = await postEvent([{ type: 'guest', id: 'g-1', name: 'Alice', contributionTarget: -1 }]).expect(
        400,
      );
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
        groupId: (await groupOf(user)).id,
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

    const userAEvent = await createEvent(eventRepository, {
      title: 'User A Event',
      participants: [{ type: 'user', id: userA.id }],
    });

    const userBEvent = await createEvent(eventRepository, {
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

    const event = await createEvent(eventRepository, {
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
        groupId: (await groupOf(user)).id,
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

    const event = await createEvent(eventRepository, {
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

    const event = await createEvent(eventRepository, {
      title: 'KPI Restricted Event',
      participants: [{ type: 'user', id: userB.id }],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer)
      .get(`/api/events/${event.id}/kpis`)
      .set('Authorization', buildAuthHeader(jwtService, userA))
      .expect(403);
  });

  it('DELETE /api/events/:id returns 204 with empty body', async () => {
    const user = await createUser(userRepository, {
      email: 'event-delete@example.com',
      name: 'Event Delete',
    });

    const event = await createEvent(eventRepository, {
      title: 'Event to Delete',
      participants: [{ type: 'user', id: user.id }],
    });

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(httpServer)
      .delete(`/api/events/${event.id}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(204);

    expect(response.text).toBe('');
  });

  it('DELETE /api/events/:id returns 404 for non-existing event', async () => {
    const user = await createUser(userRepository, {
      email: 'event-delete-404@example.com',
      name: 'Event Delete 404',
    });

    const missingId = '99999999-9999-9999-9999-999999999999';
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .delete(`/api/events/${missingId}`)
      .set('Authorization', buildAuthHeader(jwtService, user))
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/api/events/${missingId}`,
      method: 'DELETE',
    });
  });
  describe('group rules (#228)', () => {
    let httpServer: Parameters<typeof request>[0];
    let owner: User;
    let friend: User;
    let stranger: User;
    let admin: User;
    let friends: Group;
    let others: Group;

    const as = (user: User) => buildAuthHeader(jwtService, user);

    beforeEach(async () => {
      httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      owner = await createUser(userRepository, { email: 'group-owner@example.com', name: 'Owner' });
      friend = await createUser(userRepository, { email: 'group-friend@example.com', name: 'Friend' });
      stranger = await createUser(userRepository, { email: 'group-stranger@example.com', name: 'Stranger' });
      admin = await createUser(userRepository, { email: 'group-admin@example.com', name: 'Admin', role: 'admin' });
      friends = await groupOf(owner, friend);
      others = await groupOf(stranger);
    });

    const createIn = (user: User, groupId: string | undefined, participants: unknown[] = []) =>
      request(httpServer)
        .post('/api/events')
        .set('Authorization', as(user))
        .send({ groupId, title: 'Group Event', participants: [{ type: 'pot', id: '0' }, ...participants] });

    it('creates the event in a group of the creator, with its group in the response', async () => {
      const response = await createIn(owner, friends.id, [{ type: 'user', id: friend.id }]).expect(201);

      expect(getDataObjectFromBody(response.body)).toMatchObject({
        groupId: friends.id,
        group: expect.objectContaining({ id: friends.id, name: friends.name }) as unknown,
      });
    });

    it('rejects an event without a group', async () => {
      await createIn(owner, undefined).expect(400);
    });

    it('forbids creating in a group the creator is not a member of', async () => {
      await createIn(owner, others.id).expect(403);
    });

    it('forbids a user without any group from creating events', async () => {
      const loner = await createUser(userRepository, { email: 'group-loner@example.com', name: 'Loner' });

      await createIn(loner, friends.id).expect(403);
    });

    it('lets the admin create an event in any group', async () => {
      await createIn(admin, others.id, [{ type: 'user', id: stranger.id }]).expect(201);
    });

    it.each([
      ['is not a member of the group', () => stranger.id],
      ['does not exist', () => '11111111-1111-1111-1111-111111111111'],
    ])('rejects adding a user who %s, listing them, and saves nothing', async (_case, idOf) => {
      const response = await createIn(owner, friends.id, [{ type: 'user', id: idOf() }]).expect(422);

      expect(response.body).toMatchObject({ statusCode: 422, details: { userIds: [idOf()] } });
      await expect(eventRepository.count()).resolves.toBe(0);
    });

    it('rejects adding a soft deleted user', async () => {
      await userRepository.softDelete(friend.id);

      await createIn(owner, friends.id, [{ type: 'user', id: friend.id }]).expect(422);
    });

    it('lets guests in freely', async () => {
      await createIn(owner, friends.id, [{ type: 'guest', id: 'g-1', name: 'Anyone' }]).expect(201);
    });

    describe('editing', () => {
      let event: Event;

      beforeEach(async () => {
        event = await createEvent(eventRepository, {
          title: 'Friends Event',
          groupId: friends.id,
          participants: [
            { type: 'user', id: owner.id },
            { type: 'guest', id: 'g-1', name: 'Guest' },
          ],
        });
      });

      const patch = (user: User, body: Record<string, unknown>) =>
        request(httpServer).patch(`/api/events/${event.id}`).set('Authorization', as(user)).send(body);

      it('saves a member added to the event', async () => {
        await patch(owner, {
          groupId: friends.id,
          participants: [...event.participants, { type: 'user', id: friend.id }],
        }).expect(200);
      });

      it('rejects a non-member added to the event and keeps the event as it was', async () => {
        await patch(owner, { participants: [...event.participants, { type: 'user', id: stranger.id }] }).expect(422);

        const stored = await eventRepository.findOneByOrFail({ id: event.id });
        expect(stored.participants).toEqual(event.participants);
      });

      it('rejects replacing a guest with a non-member', async () => {
        await patch(owner, {
          participants: [
            { type: 'user', id: owner.id },
            { type: 'user', id: stranger.id },
          ],
          participantReplacements: [{ fromGuestId: 'g-1', toUserId: stranger.id }],
        }).expect(422);
      });

      it('keeps someone who has since left the group', async () => {
        await memberRepository.delete({ groupId: friends.id, userId: owner.id });

        await patch(owner, { title: 'Renamed', participants: event.participants }).expect(200);
      });

      it('forbids a user who is not the admin from moving the event to another group', async () => {
        await patch(owner, { groupId: others.id }).expect(403);
      });

      it('rejects the move when someone does not belong to the destination, naming them', async () => {
        const response = await patch(admin, { groupId: others.id }).expect(422);

        expect(response.body).toMatchObject({ details: { userIds: [owner.id] } });
        await expect(eventRepository.findOneByOrFail({ id: event.id })).resolves.toMatchObject({
          groupId: friends.id,
        });
      });

      it('lets the admin move the event when everybody belongs to the destination', async () => {
        await addGroupMember(memberRepository, others.id, owner.id);

        const response = await patch(admin, { groupId: others.id }).expect(200);

        expect(getDataObjectFromBody(response.body)).toMatchObject({ groupId: others.id });
      });
    });
  });
});
