import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; updateProfileIfEmpty: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      updateProfileIfEmpty: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };
    service = new AuthService(usersService as unknown as UsersService, jwtService as unknown as JwtService);
  });

  it('rejects unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);
    await expect(service.validateOrRejectGoogleUser('no@exist.com')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns user and updates profile if needed', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(user);
    await expect(service.validateOrRejectGoogleUser('a@b.com', 'Name', 'avatar')).resolves.toBe(user);
    expect(usersService.updateProfileIfEmpty).toHaveBeenCalledWith(user, 'Name', 'avatar');
  });

  it('generates jwt', () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const token = service.generateJwt(user);
    expect(token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
