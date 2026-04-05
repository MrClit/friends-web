import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { User } from '../users/user.entity';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { generateJwt: jest.Mock };
  let usersService: { toCurrentUserProfile: jest.Mock };

  const baseUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.png',
    role: 'user',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    authService = {
      generateJwt: jest.fn().mockReturnValue('jwt-token'),
    };

    usersService = {
      toCurrentUserProfile: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService, usersService as unknown as UsersService);
  });

  it('redirects Google callback to frontend auth callback with JWT payload', () => {
    const req = { user: baseUser } as Request & { user: User };
    const redirect = jest.fn();
    const res = { redirect } as unknown as Response;

    const oldFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'http://localhost:5173/friends-web/#';

    try {
      controller.googleAuthRedirect(req, res);

      expect(authService.generateJwt).toHaveBeenCalledWith(baseUser);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?token=jwt-token'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('id=user-1'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('email=user%40example.com'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('role=user'));
    } finally {
      process.env.FRONTEND_URL = oldFrontendUrl;
    }
  });

  it('redirects Microsoft callback to frontend auth callback with JWT payload', () => {
    const req = { user: baseUser } as Request & { user: User };
    const redirect = jest.fn();
    const res = { redirect } as unknown as Response;

    const oldFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'http://localhost:5173/friends-web/#';

    try {
      controller.microsoftAuthRedirect(req, res);

      expect(authService.generateJwt).toHaveBeenCalledWith(baseUser);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?token=jwt-token'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('id=user-1'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('email=user%40example.com'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('role=user'));
    } finally {
      process.env.FRONTEND_URL = oldFrontendUrl;
    }
  });

  it('returns current user profile from UsersService in getProfile', () => {
    const req = { user: baseUser } as Request & { user: User };
    const expectedProfile = {
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      avatar: baseUser.avatar,
      role: baseUser.role,
      createdAt: baseUser.createdAt,
      updatedAt: baseUser.updatedAt,
    };

    usersService.toCurrentUserProfile.mockReturnValue(expectedProfile);

    const result = controller.getProfile(req);

    expect(usersService.toCurrentUserProfile).toHaveBeenCalledWith(baseUser);
    expect(result).toEqual(expectedProfile);
  });
});
