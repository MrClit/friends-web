import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles/roles.guard';
import { UsersModule } from '../users/users.module';
import { AvatarService } from './services/avatar.service';
import { OAuthProviderService } from './services/oauth-provider.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { AUTH_STRATEGIES } from './strategies';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRATION') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AvatarService, OAuthProviderService, RefreshTokenService, ...AUTH_STRATEGIES, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
