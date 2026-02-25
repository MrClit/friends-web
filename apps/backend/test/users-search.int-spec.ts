import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/user.entity';
import { UsersService } from '../src/modules/users/users.service';
import { createUser } from './utils/test-factories';

describe('UsersService.search (integration)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    usersService = app.get(UsersService);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await userRepository.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches by name/email using case-insensitive ILIKE and sorts by name ASC', async () => {
    await Promise.all([
      createUser(userRepository, {
        email: 'ana@example.com',
        name: 'Ana',
      }),
      createUser(userRepository, {
        email: 'zz+banana@example.com',
        name: 'Zoe',
        role: 'admin',
      }),
      createUser(userRepository, {
        email: 'other@example.com',
        name: 'Bruno',
      }),
    ]);

    const result = await usersService.search('AnA');

    expect(result).toHaveLength(2);
    expect(result.map((user) => user.name)).toEqual(['Ana', 'Zoe']);
    expect(result.map((user) => user.email)).toEqual(['ana@example.com', 'zz+banana@example.com']);
  });

  it('returns at most 20 users', async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        createUser(userRepository, {
          email: `bulk-${index}@example.com`,
          name: `Bulk User ${String(index).padStart(2, '0')}`,
        }),
      ),
    );

    const result = await usersService.search('bulk user');

    expect(result).toHaveLength(20);
    const sortedNames = [...result.map((user) => user.name)].sort((first, second) => first.localeCompare(second));
    expect(result.map((user) => user.name)).toEqual(sortedNames);
  });
});
