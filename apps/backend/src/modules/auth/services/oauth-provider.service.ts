import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { AvatarService } from './avatar.service';

export const OAUTH_PROVIDER = {
  GOOGLE: 'Google',
  MICROSOFT: 'Microsoft',
} as const;

export type OAuthProviderName = (typeof OAUTH_PROVIDER)[keyof typeof OAUTH_PROVIDER];

@Injectable()
export class OAuthProviderService {
  private readonly logger = new Logger(OAuthProviderService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  async validateOrRejectOAuthUser(
    email: string,
    provider: OAuthProviderName,
    name?: string,
    avatar?: string,
  ): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt with unregistered email: ${email}`);
      throw new UnauthorizedException('Unauthorized');
    }

    const resolvedName = this.resolveNameForLogin(user, name);
    const resolvedAvatar = await this.resolveAvatarForLogin(user, avatar, provider);
    await this.usersService.updateProfileIfChanged(user, resolvedName, resolvedAvatar);
    return user;
  }

  private resolveNameForLogin(user: User, providerName?: string): string | undefined {
    const hasStoredName = Boolean(user.name && user.name.trim());
    if (hasStoredName) {
      return undefined;
    }

    if (!providerName || !providerName.trim()) {
      return undefined;
    }

    return providerName.trim();
  }

  private async resolveAvatarForLogin(
    user: User,
    providerAvatar: string | undefined,
    provider: OAuthProviderName,
  ): Promise<string | undefined> {
    if (this.avatarService.isCloudinaryAvatarUrl(user.avatar)) {
      return user.avatar ?? undefined;
    }

    if (!providerAvatar || !providerAvatar.trim()) {
      return user.avatar ?? undefined;
    }

    try {
      return await this.avatarService.uploadProviderAvatar(providerAvatar, user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(`${provider} avatar upload failed for user ${user.id}: ${errorMessage}`);
      return user.avatar ?? undefined;
    }
  }
}
