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
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt with unregistered email: ${email}`);
      throw new UnauthorizedException('No autorizado');
    }

    const resolvedAvatar = await this.resolveAvatarForLogin(user, avatar);
    await this.usersService.updateProfileIfChanged(user, name, resolvedAvatar);
    return user;
  }

  private async resolveAvatarForLogin(user: User, googleAvatar?: string): Promise<string | undefined> {
    if (this.cloudinaryAvatarService.isCloudinaryAvatarUrl(user.avatar)) {
      return user.avatar ?? undefined;
    }

    if (!googleAvatar || !googleAvatar.trim()) {
      return user.avatar ?? undefined;
    }

    try {
      return await this.cloudinaryAvatarService.uploadGoogleAvatar(googleAvatar, user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(`Cloudinary avatar upload failed for user ${user.id}: ${errorMessage}`);
      return user.avatar ?? undefined;
    }
  }

  generateJwt(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
