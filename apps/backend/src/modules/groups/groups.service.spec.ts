import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { User } from '../users/user.entity';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupsService } from './groups.service';

type QueryBuilderMock = Record<string, jest.Mock>;

/** A query builder whose chainable methods return itself; the terminal ones are plain mocks. */
const createQueryBuilderMock = (): QueryBuilderMock => {
  const chainable = ['innerJoin', 'select', 'addSelect', 'orderBy', 'addOrderBy', 'where'];
  const builder: QueryBuilderMock = { getMany: jest.fn(), getRawMany: jest.fn() };
  for (const method of chainable) {
    builder[method] = jest.fn(() => builder);
  }
  return builder;
};

const USER_1 = '11111111-1111-4111-8111-111111111111';
const USER_2 = '22222222-2222-4222-8222-222222222222';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupQuery: QueryBuilderMock;
  let userQuery: QueryBuilderMock;
  let groupRepository: Record<string, jest.Mock>;
  let memberRepository: Record<string, jest.Mock>;

  const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
  const member: AuthenticatedUser = { id: 'user-1', email: 'user@example.com', role: 'user' };

  beforeEach(async () => {
    groupQuery = createQueryBuilderMock();
    userQuery = createQueryBuilderMock();

    groupRepository = { createQueryBuilder: jest.fn(() => groupQuery), exists: jest.fn() };
    memberRepository = { exists: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(Group), useValue: groupRepository },
        { provide: getRepositoryToken(GroupMember), useValue: memberRepository },
        { provide: getRepositoryToken(User), useValue: { createQueryBuilder: jest.fn(() => userQuery) } },
      ],
    }).compile();

    service = module.get(GroupsService);
  });

  describe('findGroupsOf', () => {
    const groups = [{ id: 'group-1', name: 'Amigos', createdAt: new Date() } as Group];

    it('returns only the groups the user belongs to, as id and name', async () => {
      groupQuery.getMany.mockResolvedValue(groups);

      await expect(service.findGroupsOf(member)).resolves.toEqual([{ id: 'group-1', name: 'Amigos' }]);
      expect(groupQuery.innerJoin).toHaveBeenCalledWith('group.members', 'member', 'member.userId = :userId', {
        userId: member.id,
      });
    });

    it('returns every group to the admin', async () => {
      groupQuery.getMany.mockResolvedValue(groups);

      await service.findGroupsOf(admin);

      expect(groupQuery.innerJoin).not.toHaveBeenCalled();
    });
  });

  describe('findMembers', () => {
    it('lists the members for a member of the group', async () => {
      memberRepository.exists.mockResolvedValue(true);
      userQuery.getRawMany.mockResolvedValue([{ id: 'user-2' }]);

      await expect(service.findMembers('group-1', member)).resolves.toEqual([{ id: 'user-2' }]);
    });

    it('forbids anyone who is not a member, without saying whether the group exists', async () => {
      memberRepository.exists.mockResolvedValue(false);

      await expect(service.findMembers('group-1', member)).rejects.toThrow(ForbiddenException);
      expect(groupRepository.exists).not.toHaveBeenCalled();
    });

    it('lists the members of any group for the admin', async () => {
      groupRepository.exists.mockResolvedValue(true);
      userQuery.getRawMany.mockResolvedValue([]);

      await expect(service.findMembers('group-1', admin)).resolves.toEqual([]);
      expect(memberRepository.exists).not.toHaveBeenCalled();
    });

    it('tells the admin when the group does not exist', async () => {
      groupRepository.exists.mockResolvedValue(false);

      await expect(service.findMembers('missing', admin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertCanUse', () => {
    it('passes for a member', async () => {
      memberRepository.exists.mockResolvedValue(true);

      await expect(service.assertCanUse('group-1', member)).resolves.toBeUndefined();
    });

    it('forbids a user who is not a member, including one without groups', async () => {
      memberRepository.exists.mockResolvedValue(false);

      await expect(service.assertCanUse('group-1', member)).rejects.toThrow(ForbiddenException);
    });

    it('lets the admin use any group that exists', async () => {
      groupRepository.exists.mockResolvedValue(true);

      await expect(service.assertCanUse('group-1', admin)).resolves.toBeUndefined();
      expect(memberRepository.exists).not.toHaveBeenCalled();
    });

    it('tells the admin when the group does not exist', async () => {
      groupRepository.exists.mockResolvedValue(false);

      await expect(service.assertCanUse('missing', admin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertAreMembers', () => {
    it('does not query when there is nobody to check', async () => {
      await service.assertAreMembers('group-1', []);

      expect(userQuery.getRawMany).not.toHaveBeenCalled();
    });

    it('passes when every user is a member', async () => {
      userQuery.getRawMany.mockResolvedValue([{ id: USER_1 }, { id: USER_2 }]);

      await expect(service.assertAreMembers('group-1', [USER_1, USER_2, USER_1])).resolves.toBeUndefined();
      expect(userQuery.where).toHaveBeenCalledWith('user.id IN (:...userIds)', { userIds: [USER_1, USER_2] });
    });

    it('rejects with the outsiders listed in the details', async () => {
      userQuery.getRawMany.mockResolvedValue([{ id: USER_1 }]);

      const error = await service.assertAreMembers('group-1', [USER_1, USER_2]).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect((error as UnprocessableEntityException).getResponse()).toEqual(
        expect.objectContaining({ details: { userIds: [USER_2] } }),
      );
    });

    it('rejects an id that is not a uuid without querying for it', async () => {
      const error = await service.assertAreMembers('group-1', ['not-a-uuid']).catch((e: unknown) => e);

      expect(userQuery.getRawMany).not.toHaveBeenCalled();
      expect((error as UnprocessableEntityException).getResponse()).toEqual(
        expect.objectContaining({ details: { userIds: ['not-a-uuid'] } }),
      );
    });
  });
});
