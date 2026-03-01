import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let mockRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    softDelete: jest.Mock;
    merge: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository as unknown as Repository<User>,
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  it('findAll returns active users projection', async () => {
    const users = [{ id: 'u1', email: 'u1@test.com', role: 'user' }] as User[];
    mockRepository.find.mockResolvedValue(users);

    const result = await service.findAll();

    expect(result).toEqual(users);
    expect(mockRepository.find).toHaveBeenCalledWith({
      select: ['id', 'email', 'name', 'avatar', 'role'],
      order: { name: 'ASC' },
    });
  });

  it('create creates and returns user', async () => {
    const payload = { email: 'new@test.com', role: 'user' as const };
    const createdUser = {
      id: 'u1',
      email: payload.email,
      role: payload.role,
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockRepository.create.mockReturnValue(createdUser);
    mockRepository.save.mockResolvedValue(createdUser);

    const result = await service.create(payload);

    expect(result).toMatchObject({ id: 'u1', email: payload.email, role: payload.role });
    expect(mockRepository.create).toHaveBeenCalledWith({ email: payload.email, role: payload.role });
  });

  it('create throws ConflictException on duplicate email', async () => {
    const payload = { email: 'dup@test.com', role: 'user' as const };
    const duplicateError = Object.assign(new QueryFailedError('INSERT', [], new Error('duplicate')), {
      code: '23505',
    });

    mockRepository.create.mockReturnValue(payload);
    mockRepository.save.mockRejectedValue(duplicateError);

    await expect(service.create(payload)).rejects.toBeInstanceOf(ConflictException);
  });

  it('update throws NotFoundException when target user does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('missing-id', { name: 'Test' }, { id: 'admin-1', role: 'admin' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update blocks self-demotion from admin to user', async () => {
    const currentAdmin = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockRepository.findOne.mockResolvedValue(currentAdmin);

    await expect(service.update('admin-1', { role: 'user' }, { id: 'admin-1', role: 'admin' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('update blocks demotion of last active admin', async () => {
    const targetAdmin = {
      id: 'admin-2',
      email: 'admin2@test.com',
      role: 'admin',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockRepository.findOne.mockResolvedValue(targetAdmin);
    mockRepository.count.mockResolvedValue(1);

    await expect(service.update('admin-2', { role: 'user' }, { id: 'admin-1', role: 'admin' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('delete blocks self-delete', async () => {
    const currentAdmin = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockRepository.findOne.mockResolvedValue(currentAdmin);

    await expect(service.softDelete('admin-1', { id: 'admin-1', role: 'admin' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('delete blocks deletion of last active admin', async () => {
    const targetAdmin = {
      id: 'admin-2',
      email: 'admin2@test.com',
      role: 'admin',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockRepository.findOne.mockResolvedValue(targetAdmin);
    mockRepository.count.mockResolvedValue(1);

    await expect(service.softDelete('admin-2', { id: 'admin-1', role: 'admin' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('delete soft deletes user when rules pass', async () => {
    const targetUser = {
      id: 'user-2',
      email: 'user2@test.com',
      role: 'user',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockRepository.findOne.mockResolvedValue(targetUser);
    mockRepository.softDelete.mockResolvedValue({ affected: 1 });

    const result = await service.softDelete('user-2', { id: 'admin-1', role: 'admin' });

    expect(result).toEqual({ success: true });
    expect(mockRepository.softDelete).toHaveBeenCalledWith('user-2');
  });
});
