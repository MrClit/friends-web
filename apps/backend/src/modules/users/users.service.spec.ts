import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
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

  it('findById delegates to repository.findOne by primary key', async () => {
    const user = { id: 'u1', email: 'john@example.com' } as User;
    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findById('u1');

    expect(result).toBe(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('findById returns null when user does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing')).resolves.toBeNull();
  });

  it('findByIdOrThrow returns user when found', async () => {
    const user = { id: 'u1', email: 'john@example.com' } as User;
    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findByIdOrThrow('u1');

    expect(result).toBe(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('findByIdOrThrow throws when user does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.findByIdOrThrow('missing')).rejects.toBeInstanceOf(NotFoundException);
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
