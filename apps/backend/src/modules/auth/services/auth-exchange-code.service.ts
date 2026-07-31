import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, createHash } from 'crypto';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthExchangeCode } from '../entities/auth-exchange-code.entity';

interface IssuedExchangeCode {
  rawCode: string;
}

@Injectable()
export class AuthExchangeCodeService {
  constructor(
    @InjectRepository(AuthExchangeCode)
    private readonly exchangeCodeRepository: Repository<AuthExchangeCode>,
    private readonly configService: ConfigService,
  ) {}

  async issueCode(userId: string): Promise<IssuedExchangeCode> {
    const rawCode = randomBytes(32).toString('hex');
    const codeHash = this.hashCode(rawCode);

    await this.exchangeCodeRepository.save(
      this.exchangeCodeRepository.create({
        codeHash,
        userId,
        expiresAt: this.getExpirationDate(),
      }),
    );

    return { rawCode };
  }

  /**
   * Consumes a one-time exchange code and returns the owning user id.
   * The single-use guarantee is enforced atomically: a conditional UPDATE
   * marks the code as consumed, so concurrent redemptions can never both win.
   */
  async consumeCode(rawCode: string): Promise<string> {
    const codeHash = this.hashCode(rawCode);

    const result = await this.exchangeCodeRepository
      .createQueryBuilder()
      .update(AuthExchangeCode)
      .set({ consumedAt: new Date() })
      .where('code_hash = :codeHash AND consumed_at IS NULL AND expires_at > NOW()', { codeHash })
      .returning(['userId'])
      .execute();

    const consumed = (result.raw as { user_id: string }[])[0];
    if (!result.affected || !consumed) {
      throw new UnauthorizedException('Invalid or expired exchange code');
    }

    return consumed.user_id;
  }

  async deleteExpiredCodes(): Promise<void> {
    await this.exchangeCodeRepository.delete({ expiresAt: LessThan(new Date()) });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredCodes(): Promise<void> {
    await this.deleteExpiredCodes();
  }

  private hashCode(rawCode: string): string {
    return createHash('sha256').update(rawCode).digest('hex');
  }

  private getExpirationDate(): Date {
    const configuredSeconds = Number(this.configService.get<string>('AUTH_EXCHANGE_CODE_TTL_SECONDS') ?? '60');
    const seconds = Number.isFinite(configuredSeconds) && configuredSeconds > 0 ? configuredSeconds : 60;

    return new Date(Date.now() + seconds * 1000);
  }
}
