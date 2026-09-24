import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '../entities/refresh-token.entity';

interface IssuedRefreshToken {
  rawToken: string;
  family: string;
  rotationCount: number;
}

interface RotatedRefreshToken {
  rawToken: string;
  userId: string;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
  ) {}

  async issueRefreshToken(userId: string, family?: string, rotationCount = 0): Promise<IssuedRefreshToken> {
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const tokenFamily = family ?? randomUUID();

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        tokenHash,
        family: tokenFamily,
        userId,
        expiresAt: this.getExpirationDate(),
        rotationCount,
      }),
    );

    return {
      rawToken,
      family: tokenFamily,
      rotationCount,
    };
  }

  async rotateRefreshToken(rawToken: string): Promise<RotatedRefreshToken> {
    const tokenHash = this.hashToken(rawToken);
    const storedToken = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // A revoked token presented again is normally a replay of a stolen token, and the whole family is
    // revoked. The exception is a token rotated a few seconds ago: the access token lives only in
    // memory, so two tabs starting at once both send the same refresh token, and the loser would log
    // the user out of every tab. Within the grace window the loser gets a sibling token instead. The
    // tradeoff is that a replay inside that window is not detected. Logout and family revocations
    // never set rotatedAt, so they get no grace.
    if (storedToken.isRevoked && !this.isWithinRotationGrace(storedToken)) {
      await this.revokeFamilyTokens(storedToken.family);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const maxRotations = this.getMaxRotations();
    if (storedToken.rotationCount >= maxRotations) {
      await this.revokeFamilyTokens(storedToken.family);
      throw new UnauthorizedException('Refresh token rotation limit exceeded');
    }

    // Set once: a grace reuse must not slide the window forward.
    if (!storedToken.isRevoked) {
      storedToken.isRevoked = true;
      storedToken.rotatedAt = new Date();
      await this.refreshTokenRepository.save(storedToken);
    }

    const { rawToken: newRawToken } = await this.issueRefreshToken(
      storedToken.userId,
      storedToken.family,
      storedToken.rotationCount + 1,
    );

    return {
      rawToken: newRawToken,
      userId: storedToken.userId,
    };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const storedToken = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!storedToken || storedToken.isRevoked) {
      return;
    }

    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
  }

  async revokeFamilyTokens(family: string): Promise<void> {
    await this.refreshTokenRepository.update({ family }, { isRevoked: true });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({ expiresAt: LessThan(new Date()) });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    await this.deleteExpiredTokens();
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private isWithinRotationGrace(token: RefreshToken): boolean {
    if (!token.rotatedAt) {
      return false;
    }

    const graceMs = this.getRotationGraceSeconds() * 1000;
    return graceMs > 0 && Date.now() - token.rotatedAt.getTime() <= graceMs;
  }

  private getMaxRotations(): number {
    const configured = Number(this.configService.get<string>('REFRESH_TOKEN_MAX_ROTATIONS') ?? '100');
    return Number.isFinite(configured) && configured > 0 ? configured : 100;
  }

  private getRotationGraceSeconds(): number {
    const configured = Number(this.configService.get<string>('REFRESH_TOKEN_ROTATION_GRACE_SECONDS') ?? '10');
    return Number.isFinite(configured) && configured >= 0 ? configured : 10;
  }

  private getExpirationDate(): Date {
    const configuredDays = Number(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_DAYS') ?? '30');
    const days = Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : 30;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }
}
