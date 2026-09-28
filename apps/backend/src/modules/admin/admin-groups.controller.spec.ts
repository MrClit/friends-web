import { Test, TestingModule } from '@nestjs/testing';
import { AdminGroupsController } from './admin-groups.controller';
import { AdminGroupsService } from './admin-groups.service';

describe('AdminGroupsController', () => {
  let controller: AdminGroupsController;
  let adminGroupsService: Record<
    'findAll' | 'create' | 'rename' | 'remove' | 'findMembers' | 'addMember' | 'removeMember',
    jest.Mock
  >;

  beforeEach(async () => {
    adminGroupsService = {
      findAll: jest.fn(),
      create: jest.fn(),
      rename: jest.fn(),
      remove: jest.fn(),
      findMembers: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGroupsController],
      providers: [{ provide: AdminGroupsService, useValue: adminGroupsService }],
    }).compile();

    controller = module.get<AdminGroupsController>(AdminGroupsController);
  });

  it('findAll delegates to service', async () => {
    const groups = [{ id: 'g1', name: 'Amigos', memberCount: 2 }];
    adminGroupsService.findAll.mockResolvedValue(groups);

    await expect(controller.findAll()).resolves.toEqual(groups);
  });

  it('create delegates to service', async () => {
    adminGroupsService.create.mockResolvedValue({ id: 'g1', name: 'Amigos', memberCount: 0 });

    await controller.create({ name: 'Amigos' });

    expect(adminGroupsService.create).toHaveBeenCalledWith({ name: 'Amigos' });
  });

  it('rename delegates with the group id', async () => {
    await controller.rename('g1', { name: 'Familia' });

    expect(adminGroupsService.rename).toHaveBeenCalledWith('g1', { name: 'Familia' });
  });

  it('remove delegates with the group id', async () => {
    await controller.remove('g1');

    expect(adminGroupsService.remove).toHaveBeenCalledWith('g1');
  });

  it('findMembers delegates with the group id', async () => {
    await controller.findMembers('g1');

    expect(adminGroupsService.findMembers).toHaveBeenCalledWith('g1');
  });

  it('addMember and removeMember delegate with both ids', async () => {
    await controller.addMember('g1', 'u1');
    await controller.removeMember('g1', 'u1');

    expect(adminGroupsService.addMember).toHaveBeenCalledWith('g1', 'u1');
    expect(adminGroupsService.removeMember).toHaveBeenCalledWith('g1', 'u1');
  });
});
