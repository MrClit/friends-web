import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { ConfigService } from '@nestjs/config';
import type { AuthExchangeCodeService } from './services/auth-exchange-code.service';
import type { User } from '../users/user.entity';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    generateJwt: jest.Mock;
    generateAuthTokens: jest.Mock;
    rotateRefreshToken: jest.Mock;
    revokeRefreshToken: jest.Mock;
  };
  let usersService: { toCurrentUserProfile: jest.Mock; findByIdOrThrow: jest.Mock };
  let configService: { get: jest.Mock };
  let authExchangeCodeService: { issueCode: jest.Mock; consumeCode: jest.Mock };

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

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:5173/friends-web/#'),
    };

    authExchangeCodeService = {
      issueCode: jest.fn().mockResolvedValue({ rawCode: 'exchange-code' }),
      consumeCode: jest.fn(),
    };

    controller = new AuthController(
      authService as unknown as AuthService,
      usersService as unknown as UsersService,
      configService as unknown as ConfigService,
      authExchangeCodeService as unknown as AuthExchangeCodeService,
    );
  });

  it('redirects Google callback to frontend with success flag and one-time code, never a refresh token', async () => {
    const req = { user: baseUser } as Parameters<typeof controller.googleAuthRedirect>[0];
    const redirect = jest.fn();
    const res = { redirect } as unknown as Response;

    await controller.googleAuthRedirect(req, res);

    expect(authExchangeCodeService.issueCode).toHaveBeenCalledWith(baseUser.id);
    expect(authService.generateAuthTokens).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?success=true'));
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('code=exchange-code'));
    expect(redirect).not.toHaveBeenCalledWith(expect.stringContaining('refreshToken='));
  });

  it('redirects Microsoft callback to frontend with success flag and one-time code, never a refresh token', async () => {
    const req = { user: baseUser } as Parameters<typeof controller.microsoftAuthRedirect>[0];
    const redirect = jest.fn();
    const res = { redirect } as unknown as Response;

    await controller.microsoftAuthRedirect(req, res);

    expect(authExchangeCodeService.issueCode).toHaveBeenCalledWith(baseUser.id);
    expect(authService.generateAuthTokens).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?success=true'));
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('code=exchange-code'));
    expect(redirect).not.toHaveBeenCalledWith(expect.stringContaining('refreshToken='));
  });

  it('exchange consumes the code and returns the token pair', async () => {
    const json = jest.fn();
    const res = { json } as unknown as Response;

    authExchangeCodeService.consumeCode.mockResolvedValue('user-1');
    usersService.findByIdOrThrow.mockResolvedValue(baseUser);

    await controller.exchange({ code: 'exchange-code' }, res);

    expect(authExchangeCodeService.consumeCode).toHaveBeenCalledWith('exchange-code');
    expect(usersService.findByIdOrThrow).toHaveBeenCalledWith('user-1');
    expect(authService.generateAuthTokens).toHaveBeenCalledWith(baseUser);
    expect(json).toHaveBeenCalledWith({ data: { accessToken: 'jwt-token', refreshToken: 'refresh-token' } });
  });

  it('exchange rejects an invalid code with UnauthorizedException', async () => {
    const res = { json: jest.fn() } as unknown as Response;

    authExchangeCodeService.consumeCode.mockRejectedValue(new UnauthorizedException());

    await expect(controller.exchange({ code: 'bad-code' }, res)).rejects.toThrow(UnauthorizedException);
    expect(authService.generateAuthTokens).not.toHaveBeenCalled();
  });

  it('exchange rejects when the code owner no longer exists', async () => {
    const res = { json: jest.fn() } as unknown as Response;

    authExchangeCodeService.consumeCode.mockResolvedValue('user-gone');
    usersService.findByIdOrThrow.mockRejectedValue(new Error('not found'));

    await expect(controller.exchange({ code: 'exchange-code' }, res)).rejects.toThrow(UnauthorizedException);
    expect(authService.generateAuthTokens).not.toHaveBeenCalled();
  });

  it('refresh rotates token and returns new access token and refresh token in body', async () => {
    const body = { refreshToken: 'refresh-token' };
    const json = jest.fn();
    const res = { json } as unknown as Response;

    authService.rotateRefreshToken.mockResolvedValue({
      rawToken: 'new-refresh-token',
      userId: 'user-1',
    });
    usersService.findByIdOrThrow.mockResolvedValue(baseUser);

    await controller.refresh(body, res);

    expect(authService.rotateRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(usersService.findByIdOrThrow).toHaveBeenCalledWith('user-1');
    expect(authService.generateJwt).toHaveBeenCalledWith(baseUser);
    expect(json).toHaveBeenCalledWith({ data: { accessToken: 'jwt-token', refreshToken: 'new-refresh-token' } });
  });

  it('logout revokes refresh token from body and returns null', async () => {
    const body = { refreshToken: 'refresh-token' };
    const json = jest.fn();
    const res = { json } as unknown as Response;

    authService.revokeRefreshToken.mockResolvedValue(undefined);

    await controller.logout(body, res);

    expect(authService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(json).toHaveBeenCalledWith({ data: null });
  });

  it('returns current user profile from UsersService in getProfile', () => {
    const req = { user: baseUser } as Parameters<typeof controller.getProfile>[0];
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
