import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { User } from '../users/user.entity';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    generateJwt: jest.Mock;
    generateAuthTokens: jest.Mock;
    rotateRefreshToken: jest.Mock;
    revokeRefreshToken: jest.Mock;
  };
  let usersService: { toCurrentUserProfile: jest.Mock; findByIdOrThrow: jest.Mock };

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
      generateAuthTokens: jest.fn().mockResolvedValue({
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      }),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    usersService = {
      toCurrentUserProfile: jest.fn(),
      findByIdOrThrow: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService, usersService as unknown as UsersService);
  });

  it('redirects Google callback to frontend auth callback with JWT payload', async () => {
    const req = { user: baseUser } as Request & { user: User };
    const redirect = jest.fn();
    const cookie = jest.fn();
    const res = { redirect, cookie } as unknown as Response;

    const oldFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'http://localhost:5173/friends-web/#';

    try {
      await controller.googleAuthRedirect(req, res);

      expect(authService.generateAuthTokens).toHaveBeenCalledWith(baseUser);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?access_token=jwt-token'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('id=user-1'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('email=user%40example.com'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('role=user'));
      expect(cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.any(Object));
    } finally {
      process.env.FRONTEND_URL = oldFrontendUrl;
    }
  });

  it('redirects Microsoft callback to frontend auth callback with JWT payload', async () => {
    const req = { user: baseUser } as Request & { user: User };
    const redirect = jest.fn();
    const cookie = jest.fn();
    const res = { redirect, cookie } as unknown as Response;

    const oldFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'http://localhost:5173/friends-web/#';

    try {
      await controller.microsoftAuthRedirect(req, res);

      expect(authService.generateAuthTokens).toHaveBeenCalledWith(baseUser);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?access_token=jwt-token'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('id=user-1'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('email=user%40example.com'));
      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('role=user'));
      expect(cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.any(Object));
    } finally {
      process.env.FRONTEND_URL = oldFrontendUrl;
    }
  });

  it('refresh rotates token, reissues cookie and returns access token payload', async () => {
    const req = {
      cookies: { refresh_token: 'refresh-token' },
    } as unknown as Request;
    const cookie = jest.fn();
    const json = jest.fn();
    const res = { cookie, json } as unknown as Response;

    authService.rotateRefreshToken.mockResolvedValue({
      rawToken: 'new-refresh-token',
      userId: 'user-1',
    });
    usersService.findByIdOrThrow.mockResolvedValue(baseUser);

    await controller.refresh(req, res);

    expect(authService.rotateRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(usersService.findByIdOrThrow).toHaveBeenCalledWith('user-1');
    expect(authService.generateJwt).toHaveBeenCalledWith(baseUser);
    expect(cookie).toHaveBeenCalledWith('refresh_token', 'new-refresh-token', expect.any(Object));
    expect(json).toHaveBeenCalledWith({ data: { accessToken: 'jwt-token' } });
  });

  it('logout revokes refresh token and clears cookie', async () => {
    const req = {
      cookies: { refresh_token: 'refresh-token' },
    } as unknown as Request;
    const clearCookie = jest.fn();
    const json = jest.fn();
    const res = { clearCookie, json } as unknown as Response;

    authService.revokeRefreshToken.mockResolvedValue(undefined);

    await controller.logout(req, res);

    expect(authService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/api/auth' });
    expect(json).toHaveBeenCalledWith({ data: null });
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
