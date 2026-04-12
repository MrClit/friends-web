import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { OAUTH_PROVIDER, OAuthProviderService, type OAuthProviderName } from './services/oauth-provider.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly oauthProviderService: OAuthProviderService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async validateOrRejectGoogleUser(email: string, name?: string, avatar?: string): Promise<User> {
    return this.validateOrRejectOAuthUser(email, OAUTH_PROVIDER.GOOGLE, name, avatar);
  }

  async validateOrRejectMicrosoftUser(email: string, name?: string, avatar?: string): Promise<User> {
    return this.validateOrRejectOAuthUser(email, OAUTH_PROVIDER.MICROSOFT, name, avatar);
  }

  private validateOrRejectOAuthUser(
    email: string,
    provider: OAuthProviderName,
    name?: string,
    avatar?: string,
  ): Promise<User> {
    return this.oauthProviderService.validateOrRejectOAuthUser(email, provider, name, avatar);
  }

  generateJwt(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  async generateAuthTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateJwt(user);
    const { rawToken } = await this.refreshTokenService.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: rawToken,
    };
  }

  rotateRefreshToken(rawToken: string): Promise<{ rawToken: string; userId: string }> {
    return this.refreshTokenService.rotateRefreshToken(rawToken);
  }

  revokeRefreshToken(rawToken: string): Promise<void> {
    return this.refreshTokenService.revokeByRawToken(rawToken);
  }
}
