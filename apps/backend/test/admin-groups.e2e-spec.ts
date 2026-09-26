import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Group } from '../src/modules/groups/entities/group.entity';
import { GroupMember } from '../src/modules/groups/entities/group-member.entity';
import { User } from '../src/modules/users/user.entity';
import { applyAppTestConfig } from './utils/test-app-config';
import { addGroupMember, createGroup, createUser } from './utils/test-factories';
import { buildAuthHeader, getDataFromBody, getDataObjectFromBody } from './utils/test-http-helpers';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Admin Groups API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let memberRepository: Repository<GroupMember>;
  let admin: User;
  let adminAuth: string;

  const http = () => request(app.getHttpServer() as Parameters<typeof request>[0]);

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
  });

  beforeEach(async () => {
    // Memberships go with either end through the cascade.
    await groupRepository.createQueryBuilder().delete().from(Group).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();

    admin = await createUser(userRepository, { email: 'admin@test.com', name: 'Admin', role: 'admin' });
    adminAuth = buildAuthHeader(jwtService, admin);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('access', () => {
    const routes: Array<[string, () => request.Test]> = [
      ['GET /api/admin/groups', () => http().get('/api/admin/groups')],
      ['POST /api/admin/groups', () => http().post('/api/admin/groups').send({ name: 'Amigos' })],
      ['PATCH /api/admin/groups/:id', () => http().patch(`/api/admin/groups/${MISSING_ID}`).send({ name: 'X' })],
      ['DELETE /api/admin/groups/:id', () => http().delete(`/api/admin/groups/${MISSING_ID}`)],
      ['GET /api/admin/groups/:id/members', () => http().get(`/api/admin/groups/${MISSING_ID}/members`)],
      [
        'PUT /api/admin/groups/:id/members/:userId',
        () => http().put(`/api/admin/groups/${MISSING_ID}/members/${MISSING_ID}`),
      ],
      [
        'DELETE /api/admin/groups/:id/members/:userId',
        () => http().delete(`/api/admin/groups/${MISSING_ID}/members/${MISSING_ID}`),
      ],
    ];

    it.each(routes)('%s returns 401 without token', async (_route, send) => {
      await send().expect(401);
    });

    it.each(routes)('%s returns 403 for non-admin users', async (_route, send) => {
      const standardUser = await createUser(userRepository, { email: 'user@test.com', name: 'User' });

      await send().set('Authorization', buildAuthHeader(jwtService, standardUser)).expect(403);
    });
  });

  describe('groups', () => {
    it('creates a group, trimming its name, and lists it with its member count', async () => {
      const created = await http()
        .post('/api/admin/groups')
        .set('Authorization', adminAuth)
        .send({ name: '  Amigos  ' })
        .expect(201);

      const group = getDataObjectFromBody(created.body);
      expect(group).toMatchObject({ name: 'Amigos', memberCount: 0 });

      await addGroupMember(memberRepository, group.id as string, admin.id);

      const listed = await http().get('/api/admin/groups').set('Authorization', adminAuth).expect(200);
      expect(getDataFromBody(listed.body)).toEqual([
        expect.objectContaining({ id: group.id, name: 'Amigos', memberCount: 1 }),
      ]);
    });

    it('lists groups by name', async () => {
      await createGroup(groupRepository, 'Familia');
      await createGroup(groupRepository, 'Amigos');

      const response = await http().get('/api/admin/groups').set('Authorization', adminAuth).expect(200);

      expect((getDataFromBody(response.body) as Array<{ name: string }>).map((group) => group.name)).toEqual([
        'Amigos',
        'Familia',
      ]);
    });

    it.each([[''], ['   '], [undefined]])('rejects an empty name (%p) with 400', async (name) => {
      await http().post('/api/admin/groups').set('Authorization', adminAuth).send({ name }).expect(400);

      await expect(groupRepository.count()).resolves.toBe(0);
    });

    it('rejects a duplicate name, ignoring case, with 409', async () => {
      await createGroup(groupRepository, 'Amigos');

      await http().post('/api/admin/groups').set('Authorization', adminAuth).send({ name: 'AMIGOS' }).expect(409);

      await expect(groupRepository.count()).resolves.toBe(1);
    });

    it('renames a group, and allows changing only the case of its own name', async () => {
      const group = await createGroup(groupRepository, 'Amigos');

      const response = await http()
        .patch(`/api/admin/groups/${group.id}`)
        .set('Authorization', adminAuth)
        .send({ name: 'AMIGOS' })
        .expect(200);

      expect(getDataObjectFromBody(response.body)).toMatchObject({ id: group.id, name: 'AMIGOS' });
    });

    it('refuses to rename onto the name of another group', async () => {
      await createGroup(groupRepository, 'Amigos');
      const family = await createGroup(groupRepository, 'Familia');

      await http()
        .patch(`/api/admin/groups/${family.id}`)
        .set('Authorization', adminAuth)
        .send({ name: 'amigos' })
        .expect(409);

      await expect(groupRepository.findOneByOrFail({ id: family.id })).resolves.toMatchObject({ name: 'Familia' });
    });

    it('returns 404 when renaming a missing group', async () => {
      await http()
        .patch(`/api/admin/groups/${MISSING_ID}`)
        .set('Authorization', adminAuth)
        .send({ name: 'X' })
        .expect(404);
    });

    it('deletes a group with its memberships and keeps the users', async () => {
      const group = await createGroup(groupRepository, 'Amigos');
      await addGroupMember(memberRepository, group.id, admin.id);

      await http().delete(`/api/admin/groups/${group.id}`).set('Authorization', adminAuth).expect(200);

      await expect(groupRepository.count()).resolves.toBe(0);
      await expect(memberRepository.count()).resolves.toBe(0);
      await expect(userRepository.existsBy({ id: admin.id })).resolves.toBe(true);
    });

    it('returns 404 when deleting a missing group', async () => {
      await http().delete(`/api/admin/groups/${MISSING_ID}`).set('Authorization', adminAuth).expect(404);
    });
  });

  describe('members', () => {
    let group: Group;
    let ana: User;

    const members = async (groupId: string) => {
      const response = await http()
        .get(`/api/admin/groups/${groupId}/members`)
        .set('Authorization', adminAuth)
        .expect(200);
      return getDataFromBody(response.body) as Array<Record<string, unknown>>;
    };

    beforeEach(async () => {
      group = await createGroup(groupRepository, 'Amigos');
      ana = await createUser(userRepository, { email: 'ana@test.com', name: 'Ana' });
    });

    it('adds a user, and adding them again neither duplicates nor fails', async () => {
      await http().put(`/api/admin/groups/${group.id}/members/${ana.id}`).set('Authorization', adminAuth).expect(200);
      await http().put(`/api/admin/groups/${group.id}/members/${ana.id}`).set('Authorization', adminAuth).expect(200);

      expect(await members(group.id)).toEqual([
        { id: ana.id, name: 'Ana', email: 'ana@test.com', avatar: '', groupCount: 1 },
      ]);
    });

    it('counts every group a member belongs to', async () => {
      const family = await createGroup(groupRepository, 'Familia');
      await addGroupMember(memberRepository, group.id, ana.id);
      await addGroupMember(memberRepository, family.id, ana.id);

      expect(await members(group.id)).toEqual([expect.objectContaining({ id: ana.id, groupCount: 2 })]);
    });

    it('returns 404 when adding a user that does not exist', async () => {
      await http()
        .put(`/api/admin/groups/${group.id}/members/${MISSING_ID}`)
        .set('Authorization', adminAuth)
        .expect(404);
    });

    it('returns 404 when adding a deleted user', async () => {
      await userRepository.softDelete(ana.id);

      await http().put(`/api/admin/groups/${group.id}/members/${ana.id}`).set('Authorization', adminAuth).expect(404);
      await expect(memberRepository.count()).resolves.toBe(0);
    });

    it('returns 404 for the members of a missing group', async () => {
      await http().get(`/api/admin/groups/${MISSING_ID}/members`).set('Authorization', adminAuth).expect(404);
      await http().put(`/api/admin/groups/${MISSING_ID}/members/${ana.id}`).set('Authorization', adminAuth).expect(404);
    });

    it('removes a user from their only group, leaving them without one', async () => {
      await addGroupMember(memberRepository, group.id, ana.id);

      await http()
        .delete(`/api/admin/groups/${group.id}/members/${ana.id}`)
        .set('Authorization', adminAuth)
        .expect(200);

      expect(await members(group.id)).toEqual([]);
      await expect(userRepository.existsBy({ id: ana.id })).resolves.toBe(true);
    });

    it('removing someone who is not a member does not fail', async () => {
      await http()
        .delete(`/api/admin/groups/${group.id}/members/${ana.id}`)
        .set('Authorization', adminAuth)
        .expect(200);
    });

    it('drops a user from their groups when the admin deletes them', async () => {
      await addGroupMember(memberRepository, group.id, ana.id);

      await http().delete(`/api/admin/users/${ana.id}`).set('Authorization', adminAuth).expect(200);

      expect(await members(group.id)).toEqual([]);
      await expect(memberRepository.count()).resolves.toBe(0);
    });
  });
});
