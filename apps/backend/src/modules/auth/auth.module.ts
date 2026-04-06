import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles/roles.guard';
import { UsersModule } from '../users/users.module';
import { AvatarService } from './services/avatar.service';
import { OAuthProviderService } from './services/oauth-provider.service';
import { AUTH_STRATEGIES } from './strategies';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AvatarService, OAuthProviderService, ...AUTH_STRATEGIES, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
