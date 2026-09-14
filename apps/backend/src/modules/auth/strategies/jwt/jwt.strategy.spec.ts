import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import type { UsersService } from '../../../users/users.service';
import type { User } from '../../../users/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: { findById: jest.Mock; findByEmail: jest.Mock };
  let config: Partial<ConfigService>;

  const payload = { sub: 'user-1', email: 'john@example.com', role: 'user' };

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    config = {
      get: jest.fn().mockImplementation((key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined)),
    };
    strategy = new JwtStrategy(config as ConfigService, usersService as unknown as UsersService);
  });

  it('throws at construction when JWT_SECRET is missing', () => {
    const emptyConfig = { get: jest.fn().mockReturnValue(undefined) } as Partial<ConfigService>;

    expect(() => new JwtStrategy(emptyConfig as ConfigService, usersService as unknown as UsersService)).toThrow(
      'JWT_SECRET is not defined',
    );
  });

  it('resolves the user by the token sub, not by email', async () => {
    const user = { id: 'user-1', email: 'john@example.com' } as User;
    usersService.findById.mockResolvedValue(user);

    const result = await strategy.validate(payload);

    expect(result).toBe(user);
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(usersService.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects with UnauthorizedException when the user does not exist', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
