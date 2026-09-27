import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Event } from '../src/modules/events/entities/event.entity';
import { Group } from '../src/modules/groups/entities/group.entity';
import { GroupMember } from '../src/modules/groups/entities/group-member.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { addGroupMember, createGroup, createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody } from './utils/test-http-helpers';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Groups API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let memberRepository: Repository<GroupMember>;
  let eventRepository: Repository<Event>;
  let user: User;
  let friend: User;
  let stranger: User;
  let admin: User;
  let friends: Group;
  let others: Group;

  const http = () => request(app.getHttpServer() as Parameters<typeof request>[0]);
  const as = (actor: User) => buildAuthHeader(jwtService, actor);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppTestConfig(app);
    await app.init();

    jwtService = app.get(JwtService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    groupRepository = app.get<Repository<Group>>(getRepositoryToken(Group));
    memberRepository = app.get<Repository<GroupMember>>(getRepositoryToken(GroupMember));
    eventRepository = app.get<Repository<Event>>(getRepositoryToken(Event));
  });

  beforeEach(async () => {
    // Events first: they restrict the delete of their group. Memberships go with the groups.
    await eventRepository.createQueryBuilder().delete().from(Event).execute();
    await groupRepository.createQueryBuilder().delete().from(Group).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();

    user = await createUser(userRepository, { email: 'user@test.com', name: 'User' });
    friend = await createUser(userRepository, { email: 'friend@test.com', name: 'Friend' });
    stranger = await createUser(userRepository, { email: 'stranger@test.com', name: 'Stranger' });
    admin = await createUser(userRepository, { email: 'admin@test.com', name: 'Admin', role: 'admin' });

    friends = await createGroup(groupRepository, 'Amigos');
    others = await createGroup(groupRepository, 'Otros');
    await addGroupMember(memberRepository, friends.id, user.id);
    await addGroupMember(memberRepository, friends.id, friend.id);
    await addGroupMember(memberRepository, others.id, stranger.id);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['GET /api/groups', () => http().get('/api/groups')],
    ['GET /api/groups/:id/members', () => http().get(`/api/groups/${MISSING_ID}/members`)],
  ])('%s returns 401 without token', async (_route, send) => {
    await send().expect(401);
  });

  describe('GET /api/groups', () => {
    it('returns only the groups of the user', async () => {
      const response = await http().get('/api/groups').set('Authorization', as(user)).expect(200);

      expect(getDataFromBody(response.body)).toEqual([{ id: friends.id, name: 'Amigos' }]);
    });

    it('returns an empty list to a user without groups', async () => {
      const loner = await createUser(userRepository, { email: 'loner@test.com', name: 'Loner' });

      const response = await http().get('/api/groups').set('Authorization', as(loner)).expect(200);

      expect(getDataFromBody(response.body)).toEqual([]);
    });

    it('returns every group to the admin, by name', async () => {
      const response = await http().get('/api/groups').set('Authorization', as(admin)).expect(200);

      expect(getDataFromBody(response.body)).toEqual([
        { id: friends.id, name: 'Amigos' },
        { id: others.id, name: 'Otros' },
      ]);
    });
  });

  describe('GET /api/groups/:id/members', () => {
    it('lists the members with name, email and avatar for a member of the group', async () => {
      const response = await http().get(`/api/groups/${friends.id}/members`).set('Authorization', as(user)).expect(200);

      expect(getDataFromBody(response.body)).toEqual([
        { id: friend.id, name: 'Friend', email: 'friend@test.com', avatar: '' },
        { id: user.id, name: 'User', email: 'user@test.com', avatar: '' },
      ]);
    });

    it('forbids a user who is not a member', async () => {
      await http().get(`/api/groups/${others.id}/members`).set('Authorization', as(user)).expect(403);
    });

    it('answers a missing group with the same 403, so its existence does not leak', async () => {
      await http().get(`/api/groups/${MISSING_ID}/members`).set('Authorization', as(user)).expect(403);
    });

    it('lists the members of any group to the admin', async () => {
      const response = await http().get(`/api/groups/${others.id}/members`).set('Authorization', as(admin)).expect(200);

      expect(getDataFromBody(response.body)).toEqual([expect.objectContaining({ id: stranger.id })]);
    });

    it('tells the admin when the group does not exist', async () => {
      await http().get(`/api/groups/${MISSING_ID}/members`).set('Authorization', as(admin)).expect(404);
    });
  });

  // The global directory is gone: the members of a group are the only list of users left (#121).
  it.each(['/api/users', '/api/users/search?q=a'])('%s no longer exists', async (path) => {
    await http().get(path).set('Authorization', as(user)).expect(404);
  });
});
