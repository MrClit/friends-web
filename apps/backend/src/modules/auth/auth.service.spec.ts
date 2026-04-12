import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { OAUTH_PROVIDER, OAuthProviderService } from './services/oauth-provider.service';
import { RefreshTokenService } from './services/refresh-token.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock };
  let oauthProviderService: { validateOrRejectOAuthUser: jest.Mock };
  let refreshTokenService: {
    issueRefreshToken: jest.Mock;
    rotateRefreshToken: jest.Mock;
    revokeByRawToken: jest.Mock;
  };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };
    oauthProviderService = {
      validateOrRejectOAuthUser: jest.fn(),
    };
    refreshTokenService = {
      issueRefreshToken: jest.fn().mockResolvedValue({ rawToken: 'refresh-token', family: 'family-1' }),
      rotateRefreshToken: jest.fn(),
      revokeByRawToken: jest.fn(),
    };
    service = new AuthService(
      jwtService as unknown as JwtService,
      oauthProviderService as unknown as OAuthProviderService,
      refreshTokenService as unknown as RefreshTokenService,
    );
  });

  it('delegates Google validation to OAuthProviderService', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    oauthProviderService.validateOrRejectOAuthUser.mockResolvedValue(user);

    await expect(service.validateOrRejectGoogleUser('a@b.com', 'Name', 'avatar')).resolves.toBe(user);

    expect(oauthProviderService.validateOrRejectOAuthUser).toHaveBeenCalledWith(
      'a@b.com',
      OAUTH_PROVIDER.GOOGLE,
      'Name',
      'avatar',
    );
  });

  it('delegates Microsoft validation to OAuthProviderService', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    oauthProviderService.validateOrRejectOAuthUser.mockResolvedValue(user);

    await expect(service.validateOrRejectMicrosoftUser('a@b.com', 'Name')).resolves.toBe(user);

    expect(oauthProviderService.validateOrRejectOAuthUser).toHaveBeenCalledWith(
      'a@b.com',
      OAUTH_PROVIDER.MICROSOFT,
      'Name',
      undefined,
    );
  });

  it('generates jwt', () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const token = service.generateJwt(user);
    expect(token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('generates access and refresh token pair', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await service.generateAuthTokens(user);

    expect(result).toEqual({
      accessToken: 'signed-token',
      refreshToken: 'refresh-token',
    });
    expect(refreshTokenService.issueRefreshToken).toHaveBeenCalledWith('1');
  });

  it('delegates refresh token rotation', async () => {
    refreshTokenService.rotateRefreshToken.mockResolvedValue({
      rawToken: 'next-refresh-token',
      userId: '1',
    });

    await expect(service.rotateRefreshToken('refresh-token')).resolves.toEqual({
      rawToken: 'next-refresh-token',
      userId: '1',
    });
    expect(refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith('refresh-token');
  });

  it('delegates refresh token revoke', async () => {
    refreshTokenService.revokeByRawToken.mockResolvedValue(undefined);

    await expect(service.revokeRefreshToken('refresh-token')).resolves.toBeUndefined();
    expect(refreshTokenService.revokeByRawToken).toHaveBeenCalledWith('refresh-token');
  });
});
