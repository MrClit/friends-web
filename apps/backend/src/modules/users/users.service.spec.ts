import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository as unknown as Repository<User>,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('findByEmail delegates to repository.findOne', async () => {
    const user = { id: 'u1', email: 'john@example.com' } as User;
    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findByEmail('john@example.com');

    expect(result).toBe(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
  });

  it('updateProfileIfChanged updates fields and saves when changed', async () => {
    const user = { id: 'u1', name: 'Old Name', avatar: 'old-avatar' } as User;
    mockRepository.save.mockResolvedValue(user);

    const result = await service.updateProfileIfChanged(user, 'New Name', 'new-avatar');

    expect(result.name).toBe('New Name');
    expect(result.avatar).toBe('new-avatar');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledWith(user);
  });

  it('updateProfileIfChanged does not save when no fields changed', async () => {
    const user = { id: 'u1', name: 'Same Name', avatar: 'same-avatar' } as User;

    const result = await service.updateProfileIfChanged(user, 'Same Name', 'same-avatar');

    expect(result).toBe(user);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('findAll returns users with expected projection and order', async () => {
    const users = [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ] as User[];
    mockRepository.find.mockResolvedValue(users);

    const result = await service.findAll();

    expect(result).toEqual(users);
    expect(mockRepository.find).toHaveBeenCalledWith({
      select: ['id', 'email', 'name', 'avatar', 'role'],
      order: { name: 'ASC' },
    });
  });

  it('search builds query with ILIKE and limit 20', async () => {
    const users = [{ id: 'u1', name: 'Alice' }] as User[];
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(users),
    };
    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.search('ali');

    expect(result).toEqual(users);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.where).toHaveBeenCalledWith('(user.name ILIKE :query OR user.email ILIKE :query)', {
      query: '%ali%',
    });
    expect(queryBuilder.select).toHaveBeenCalledWith([
      'user.id',
      'user.email',
      'user.name',
      'user.avatar',
      'user.role',
    ]);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('user.name', 'ASC');
    expect(queryBuilder.limit).toHaveBeenCalledWith(20);
    expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
  });

  it('getCurrentUserProfileByIdOrThrow returns current user profile projection', async () => {
    const now = new Date();
    const user = {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: 'https://example.com/avatar.png',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    } as User;
    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.getCurrentUserProfileByIdOrThrow('u1');

    expect(result).toEqual({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: 'https://example.com/avatar.png',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    });
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('getCurrentUserProfileByIdOrThrow throws when user does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.getCurrentUserProfileByIdOrThrow('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateCurrentUserProfile updates changed fields and returns profile dto', async () => {
    const now = new Date();
    const user = {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: 'old-avatar',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    } as User;
    mockRepository.findOne.mockResolvedValue(user);
    mockRepository.save.mockResolvedValue({
      ...user,
      name: 'New Alice',
      avatar: 'new-avatar',
    });

    const result = await service.updateCurrentUserProfile('u1', {
      name: 'New Alice',
      avatar: 'new-avatar',
    });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'u1',
        name: 'New Alice',
        avatar: 'new-avatar',
      }),
    );
    expect(result.name).toBe('New Alice');
    expect(result.avatar).toBe('new-avatar');
  });

  it('updateCurrentUserProfile does not save when fields are unchanged', async () => {
    const now = new Date();
    const user = {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: 'same-avatar',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    } as User;
    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.updateCurrentUserProfile('u1', {
      name: 'Alice',
      avatar: 'same-avatar',
    });

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(result.name).toBe('Alice');
    expect(result.avatar).toBe('same-avatar');
  });
});
