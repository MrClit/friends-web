import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findAll: jest.Mock; search: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('findAll delegates to usersService.findAll', async () => {
    const users = [
      { id: 'u1', email: 'alice@example.com', name: 'Alice' },
      { id: 'u2', email: 'bob@example.com', name: 'Bob' },
    ];
    usersService.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(result).toEqual(users);
    expect(usersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('search delegates to usersService.search with query param', async () => {
    const users = [{ id: 'u1', email: 'alice@example.com', name: 'Alice' }];
    usersService.search.mockResolvedValue(users);

    const result = await controller.search('ali');

    expect(result).toEqual(users);
    expect(usersService.search).toHaveBeenCalledWith('ali');
    expect(usersService.search).toHaveBeenCalledTimes(1);
  });
});
