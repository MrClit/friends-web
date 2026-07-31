import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthExchangeCode } from '../src/modules/auth/entities/auth-exchange-code.entity';
import { AuthExchangeCodeService } from '../src/modules/auth/services/auth-exchange-code.service';
import { User } from '../src/modules/users/user.entity';
import { createUser } from './utils/test-factories';

const hashCode = (rawCode: string): string => createHash('sha256').update(rawCode).digest('hex');

describe('AuthExchangeCodeService (integration)', () => {
  let app: INestApplication;
  let exchangeCodeService: AuthExchangeCodeService;
  let exchangeCodeRepository: Repository<AuthExchangeCode>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    exchangeCodeService = app.get(AuthExchangeCodeService);
    exchangeCodeRepository = app.get<Repository<AuthExchangeCode>>(getRepositoryToken(AuthExchangeCode));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await exchangeCodeRepository.createQueryBuilder().delete().from(AuthExchangeCode).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('issueCode: stores SHA-256 hash, not the raw code', async () => {
    const user = await createUser(userRepository, { email: 'hash@test.com', name: 'Hash User' });
    const { rawCode } = await exchangeCodeService.issueCode(user.id);

    const record = await exchangeCodeRepository.findOne({ where: { userId: user.id } });

    expect(record).not.toBeNull();
    expect(record!.codeHash).toBe(hashCode(rawCode));
    expect(record!.codeHash).not.toBe(rawCode);
    expect(record!.consumedAt).toBeNull();
  });

  it('consumeCode: returns the user id and marks the code as consumed', async () => {
    const user = await createUser(userRepository, { email: 'consume@test.com', name: 'Consume User' });
    const { rawCode } = await exchangeCodeService.issueCode(user.id);

    const userId = await exchangeCodeService.consumeCode(rawCode);

    expect(userId).toBe(user.id);
    const record = await exchangeCodeRepository.findOne({ where: { codeHash: hashCode(rawCode) } });
    expect(record!.consumedAt).not.toBeNull();
  });

  it('consumeCode: rejects an already consumed code (single use)', async () => {
    const user = await createUser(userRepository, { email: 'reuse@test.com', name: 'Reuse User' });
    const { rawCode } = await exchangeCodeService.issueCode(user.id);

    await exchangeCodeService.consumeCode(rawCode);

    await expect(exchangeCodeService.consumeCode(rawCode)).rejects.toThrow(UnauthorizedException);
  });

  it('consumeCode: concurrent redemptions — exactly one wins', async () => {
    const user = await createUser(userRepository, { email: 'race@test.com', name: 'Race User' });
    const { rawCode } = await exchangeCodeService.issueCode(user.id);

    const attempts = await Promise.allSettled([
      exchangeCodeService.consumeCode(rawCode),
      exchangeCodeService.consumeCode(rawCode),
      exchangeCodeService.consumeCode(rawCode),
    ]);

    const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
    const rejected = attempts.filter((a) => a.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);
    expect(fulfilled[0].value).toBe(user.id);
  });

  it('consumeCode: rejects an expired code', async () => {
    const user = await createUser(userRepository, { email: 'expired@test.com', name: 'Expired User' });
    const { rawCode } = await exchangeCodeService.issueCode(user.id);

    await exchangeCodeRepository.update(
      { codeHash: hashCode(rawCode) },
      { expiresAt: new Date('2000-01-01') },
    );

    await expect(exchangeCodeService.consumeCode(rawCode)).rejects.toThrow(UnauthorizedException);
  });

  it('consumeCode: rejects an unknown code', async () => {
    await expect(exchangeCodeService.consumeCode('nonexistent-code')).rejects.toThrow(UnauthorizedException);
  });

  it('deleteExpiredCodes: removes expired codes and keeps active ones', async () => {
    const user = await createUser(userRepository, { email: 'cleanup@test.com', name: 'Cleanup User' });
    const { rawCode: activeRawCode } = await exchangeCodeService.issueCode(user.id);
    const { rawCode: expiredRawCode } = await exchangeCodeService.issueCode(user.id);

    await exchangeCodeRepository.update(
      { codeHash: hashCode(expiredRawCode) },
      { expiresAt: new Date('2000-01-01') },
    );

    await exchangeCodeService.deleteExpiredCodes();

    const remaining = await exchangeCodeRepository.find({ where: { userId: user.id } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].codeHash).toBe(hashCode(activeRawCode));
  });
});
