import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { CloudinaryAvatarService } from './cloudinary-avatar.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryAvatarService: CloudinaryAvatarService,
  ) {}

  async validateOrRejectGoogleUser(email: string, name?: string, avatar?: string): Promise<User> {
    return this.validateOrRejectOAuthUser(email, 'Google', name, avatar);
  }

  async validateOrRejectMicrosoftUser(email: string, name?: string, avatar?: string): Promise<User> {
    return this.validateOrRejectOAuthUser(email, 'Microsoft', name, avatar);
  }

  private async validateOrRejectOAuthUser(
    email: string,
    provider: 'Google' | 'Microsoft',
    name?: string,
    avatar?: string,
  ): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt with unregistered email: ${email}`);
      throw new UnauthorizedException('No autorizado');
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
    provider: 'Google' | 'Microsoft',
  ): Promise<string | undefined> {
    if (this.cloudinaryAvatarService.isCloudinaryAvatarUrl(user.avatar)) {
      return user.avatar ?? undefined;
    }

    if (!providerAvatar || !providerAvatar.trim()) {
      return user.avatar ?? undefined;
    }

    try {
      return await this.cloudinaryAvatarService.uploadProviderAvatar(providerAvatar, user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(`${provider} avatar upload failed for user ${user.id}: ${errorMessage}`);
      return user.avatar ?? undefined;
    }
  }

  generateJwt(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
