import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { User } from '../users/user.entity';
import { Event } from '../events/entities/event.entity';
import { AdminGroupsService } from './admin-groups.service';

type QueryBuilderMock = Record<string, jest.Mock>;

/** A query builder whose chainable methods return itself; the terminal ones are plain mocks. */
const createQueryBuilderMock = (): QueryBuilderMock => {
  const chainable = [
    'leftJoin',
    'innerJoin',
    'select',
    'addSelect',
    'groupBy',
    'orderBy',
    'addOrderBy',
    'where',
    'andWhere',
    'insert',
    'into',
    'values',
    'orIgnore',
  ];
  const builder: QueryBuilderMock = { getRawMany: jest.fn(), getExists: jest.fn(), execute: jest.fn() };
  for (const method of chainable) {
    builder[method] = jest.fn(() => builder);
  }
  return builder;
};

describe('AdminGroupsService', () => {
  let service: AdminGroupsService;
  let groupQuery: QueryBuilderMock;
  let memberQuery: QueryBuilderMock;
  let userQuery: QueryBuilderMock;
  let groupRepository: Record<string, jest.Mock>;
  let memberRepository: Record<string, jest.Mock>;
  let userRepository: Record<string, jest.Mock>;
  let eventRepository: Record<string, jest.Mock>;

  const group = {
    id: 'group-1',
    name: 'Amigos',
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-01'),
  } as Group;

  beforeEach(async () => {
    groupQuery = createQueryBuilderMock();
    memberQuery = createQueryBuilderMock();
    userQuery = createQueryBuilderMock();

    groupRepository = {
      createQueryBuilder: jest.fn(() => groupQuery),
      create: jest.fn((input: Partial<Group>) => ({ ...input })),
      save: jest.fn((input: Group) => Promise.resolve({ ...group, ...input })),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    memberRepository = {
      createQueryBuilder: jest.fn(() => memberQuery),
      count: jest.fn(),
      delete: jest.fn(),
    };
    userRepository = {
      createQueryBuilder: jest.fn(() => userQuery),
      exists: jest.fn(),
    };
    eventRepository = { exists: jest.fn().mockResolvedValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGroupsService,
        { provide: getRepositoryToken(Group), useValue: groupRepository },
        { provide: getRepositoryToken(GroupMember), useValue: memberRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Event), useValue: eventRepository },
      ],
    }).compile();

    service = module.get<AdminGroupsService>(AdminGroupsService);
  });

  it('findAll returns the rows with their member count', async () => {
    const rows = [{ ...group, memberCount: 3 }];
    groupQuery.getRawMany.mockResolvedValue(rows);

    await expect(service.findAll()).resolves.toEqual(rows);
    expect(groupQuery.orderBy).toHaveBeenCalledWith('group.name', 'ASC');
  });

  describe('create', () => {
    it('creates a group with no members', async () => {
      groupQuery.getExists.mockResolvedValue(false);

      const result = await service.create({ name: 'Amigos' });

      expect(result).toEqual({ ...group, memberCount: 0 });
      expect(groupRepository.create).toHaveBeenCalledWith({ name: 'Amigos' });
    });

    it('rejects a name already taken, ignoring case', async () => {
      groupQuery.getExists.mockResolvedValue(true);

      await expect(service.create({ name: 'AMIGOS' })).rejects.toBeInstanceOf(ConflictException);
      expect(groupQuery.where).toHaveBeenCalledWith('LOWER(group.name) = LOWER(:name)', { name: 'AMIGOS' });
      expect(groupRepository.save).not.toHaveBeenCalled();
    });

    it('turns a unique violation from a racing request into a conflict', async () => {
      groupQuery.getExists.mockResolvedValue(false);
      const violation = Object.assign(new QueryFailedError('INSERT', [], new Error('duplicate')), { code: '23505' });
      groupRepository.save.mockRejectedValue(violation);

      await expect(service.create({ name: 'Amigos' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows any other database error', async () => {
      groupQuery.getExists.mockResolvedValue(false);
      const failure = new Error('connection lost');
      groupRepository.save.mockRejectedValue(failure);

      await expect(service.create({ name: 'Amigos' })).rejects.toBe(failure);
    });
  });

  describe('rename', () => {
    it('renames the group and reports its member count', async () => {
      groupRepository.findOne.mockResolvedValue({ ...group });
      groupQuery.getExists.mockResolvedValue(false);
      memberRepository.count.mockResolvedValue(2);

      const result = await service.rename('group-1', { name: 'Familia' });

      expect(result).toEqual({ ...group, name: 'Familia', memberCount: 2 });
    });

    it('leaves the group itself out of the name check', async () => {
      groupRepository.findOne.mockResolvedValue({ ...group });
      groupQuery.getExists.mockResolvedValue(false);
      memberRepository.count.mockResolvedValue(0);

      await service.rename('group-1', { name: 'AMIGOS' });

      expect(groupQuery.andWhere).toHaveBeenCalledWith('group.id <> :exceptGroupId', { exceptGroupId: 'group-1' });
    });

    it('rejects a name taken by another group', async () => {
      groupRepository.findOne.mockResolvedValue({ ...group });
      groupQuery.getExists.mockResolvedValue(true);

      await expect(service.rename('group-1', { name: 'Familia' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFoundException for a missing group', async () => {
      groupRepository.findOne.mockResolvedValue(null);

      await expect(service.rename('missing', { name: 'Familia' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the group', async () => {
      groupRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('group-1')).resolves.toEqual({ success: true });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      groupRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to delete a group that still has events', async () => {
      eventRepository.exists.mockResolvedValue(true);

      await expect(service.remove('group-1')).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(groupRepository.delete).not.toHaveBeenCalled();
    });

    it('turns the foreign key refusal into the same 422, for an event created after the check', async () => {
      const violation = Object.assign(new QueryFailedError('DELETE', [], new Error('restrict')), { code: '23503' });
      groupRepository.delete.mockRejectedValue(violation);

      await expect(service.remove('group-1')).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('lets any other delete error through', async () => {
      const failure = new Error('connection lost');
      groupRepository.delete.mockRejectedValue(failure);

      await expect(service.remove('group-1')).rejects.toBe(failure);
    });
  });

  describe('findMembers', () => {
    it('returns the members of an existing group', async () => {
      const members = [{ id: 'user-1', name: 'Ana', email: 'ana@test.com', avatar: null, groupCount: 1 }];
      groupRepository.findOne.mockResolvedValue(group);
      userQuery.getRawMany.mockResolvedValue(members);

      await expect(service.findMembers('group-1')).resolves.toEqual(members);
    });

    it('throws NotFoundException for a missing group', async () => {
      groupRepository.findOne.mockResolvedValue(null);

      await expect(service.findMembers('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addMember', () => {
    it('inserts the membership, ignoring one that already exists', async () => {
      groupRepository.findOne.mockResolvedValue(group);
      userRepository.exists.mockResolvedValue(true);

      await expect(service.addMember('group-1', 'user-1')).resolves.toEqual({ success: true });
      expect(memberQuery.values).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'user-1' });
      expect(memberQuery.orIgnore).toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing or deleted user', async () => {
      groupRepository.findOne.mockResolvedValue(group);
      userRepository.exists.mockResolvedValue(false);

      await expect(service.addMember('group-1', 'gone')).rejects.toBeInstanceOf(NotFoundException);
      expect(memberQuery.execute).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing group', async () => {
      groupRepository.findOne.mockResolvedValue(null);

      await expect(service.addMember('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('deletes the membership', async () => {
      groupRepository.findOne.mockResolvedValue(group);

      await expect(service.removeMember('group-1', 'user-1')).resolves.toEqual({ success: true });
      expect(memberRepository.delete).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'user-1' });
    });

    it('throws NotFoundException for a missing group', async () => {
      groupRepository.findOne.mockResolvedValue(null);

      await expect(service.removeMember('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
