import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { User } from '../users/user.entity';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let adminUsersService: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    adminUsersService = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: AdminUsersService,
          useValue: adminUsersService,
        },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
  });

  it('findAll delegates to service', async () => {
    const users = [{ id: 'u1', email: 'a@test.com', role: 'user' }];
    adminUsersService.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(result).toEqual(users);
    expect(adminUsersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('create delegates to service', async () => {
    const payload = { email: 'new@test.com', role: 'user' as const };
    const created = { id: 'u1', ...payload };
    adminUsersService.create.mockResolvedValue(created);

    const result = await controller.create(payload);

    expect(result).toEqual(created);
    expect(adminUsersService.create).toHaveBeenCalledWith(payload);
  });

  it('update delegates with actor context', async () => {
    const req = { user: { id: 'admin-1', role: 'admin' } as User } as { user: User };
    const payload = { name: 'Updated' };
    const updated = { id: 'u1', email: 'u@test.com', role: 'user', ...payload };
    adminUsersService.update.mockResolvedValue(updated);

    const result = await controller.update('u1', payload, req as never);

    expect(result).toEqual(updated);
    expect(adminUsersService.update).toHaveBeenCalledWith('u1', payload, {
      id: 'admin-1',
      role: 'admin',
    });
  });

  it('remove delegates with actor context', async () => {
    const req = { user: { id: 'admin-1', role: 'admin' } as User } as { user: User };
    adminUsersService.softDelete.mockResolvedValue({ success: true });

    const result = await controller.remove('u1', req as never);

    expect(result).toEqual({ success: true });
    expect(adminUsersService.softDelete).toHaveBeenCalledWith('u1', {
      id: 'admin-1',
      role: 'admin',
    });
  });
});
