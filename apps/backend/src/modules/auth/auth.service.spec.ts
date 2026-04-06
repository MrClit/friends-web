import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { OAUTH_PROVIDER, OAuthProviderService } from './services/oauth-provider.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock };
  let oauthProviderService: { validateOrRejectOAuthUser: jest.Mock };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };
    oauthProviderService = {
      validateOrRejectOAuthUser: jest.fn(),
    };
    service = new AuthService(
      jwtService as unknown as JwtService,
      oauthProviderService as unknown as OAuthProviderService,
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
});
