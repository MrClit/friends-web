import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let groupsService: Record<'findGroupsOf' | 'findMembers', jest.Mock>;

  const user: AuthenticatedUser = { id: 'user-1', email: 'user@example.com', role: 'user' };

  beforeEach(async () => {
    groupsService = { findGroupsOf: jest.fn(), findMembers: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: groupsService }],
    }).compile();

    controller = module.get(GroupsController);
  });

  it('findMine delegates to service with the current user', async () => {
    const groups = [{ id: 'g1', name: 'Amigos' }];
    groupsService.findGroupsOf.mockResolvedValue(groups);

    await expect(controller.findMine(user)).resolves.toEqual(groups);
    expect(groupsService.findGroupsOf).toHaveBeenCalledWith(user);
  });

  it('findMembers delegates to service with the current user', async () => {
    groupsService.findMembers.mockResolvedValue([]);

    await expect(controller.findMembers('g1', user)).resolves.toEqual([]);
    expect(groupsService.findMembers).toHaveBeenCalledWith('g1', user);
  });
});
