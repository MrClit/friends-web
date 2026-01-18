import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrRejectGoogleUser(email: string, name?: string, avatar?: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt with unregistered email: ${email}`);
      throw new UnauthorizedException('No autorizado');
    }
    await this.usersService.updateProfileIfChanged(user, name, avatar);
    return user;
  }

  generateJwt(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
