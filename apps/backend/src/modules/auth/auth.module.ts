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
import { AuthExchangeCodeService } from './services/auth-exchange-code.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthExchangeCode } from './entities/auth-exchange-code.entity';
import { AUTH_STRATEGIES } from './strategies';
import { DEFAULT_JWT_EXPIRATION, type JwtExpiration } from '../../config/auth.constants';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, AuthExchangeCode]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get<JwtExpiration>('JWT_EXPIRATION') ?? DEFAULT_JWT_EXPIRATION },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    AvatarService,
    OAuthProviderService,
    RefreshTokenService,
    AuthExchangeCodeService,
    ...AUTH_STRATEGIES,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
