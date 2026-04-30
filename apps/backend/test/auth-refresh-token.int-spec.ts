import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { RefreshToken } from '../src/modules/auth/entities/refresh-token.entity';
import { RefreshTokenService } from '../src/modules/auth/services/refresh-token.service';
import { User } from '../src/modules/users/user.entity';
import { createUser } from './utils/test-factories';

const hashToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex');

describe('RefreshTokenService (integration)', () => {
  let app: INestApplication;
  let refreshTokenService: RefreshTokenService;
  let refreshTokenRepository: Repository<RefreshToken>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    refreshTokenService = app.get(RefreshTokenService);
    refreshTokenRepository = app.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await refreshTokenRepository.createQueryBuilder().delete().from(RefreshToken).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();
  });

  afterAll(async () => {
    await app.close();
  });

  it('issueRefreshToken: stores SHA-256 hash, not the raw token', async () => {
    const user = await createUser(userRepository, { email: 'hash@test.com', name: 'Hash User' });
    const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);

    const record = await refreshTokenRepository.findOne({ where: { userId: user.id } });

    expect(record).not.toBeNull();
    expect(record!.tokenHash).toBe(hashToken(rawToken));
    expect(record!.tokenHash).not.toBe(rawToken);
  });

  it('rotateRefreshToken: revokes old token and issues new one in same family with incremented rotationCount', async () => {
    const user = await createUser(userRepository, { email: 'rotate@test.com', name: 'Rotate User' });
    const { rawToken: token0, family } = await refreshTokenService.issueRefreshToken(user.id);

    const { rawToken: token1, userId } = await refreshTokenService.rotateRefreshToken(token0);

    expect(userId).toBe(user.id);
    expect(token1).not.toBe(token0);

    const oldRecord = await refreshTokenRepository.findOne({ where: { tokenHash: hashToken(token0) } });
    expect(oldRecord!.isRevoked).toBe(true);

    const newRecord = await refreshTokenRepository.findOne({ where: { tokenHash: hashToken(token1) } });
    expect(newRecord!.family).toBe(family);
    expect(newRecord!.rotationCount).toBe(1);
    expect(newRecord!.isRevoked).toBe(false);
  });

  it('rotateRefreshToken: throws UnauthorizedException for an unknown token', async () => {
    await expect(refreshTokenService.rotateRefreshToken('nonexistent-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rotateRefreshToken: throws UnauthorizedException for an expired token', async () => {
    const user = await createUser(userRepository, { email: 'expired@test.com', name: 'Expired User' });
    const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);

    await refreshTokenRepository.update(
      { tokenHash: hashToken(rawToken) },
      { expiresAt: new Date('2000-01-01') },
    );

    await expect(refreshTokenService.rotateRefreshToken(rawToken)).rejects.toThrow(UnauthorizedException);
  });

  it('rotateRefreshToken: using a revoked token triggers family revocation (breach detection)', async () => {
    const user = await createUser(userRepository, { email: 'breach@test.com', name: 'Breach User' });
    const { rawToken: token0, family } = await refreshTokenService.issueRefreshToken(user.id);

    // Legitimate rotation: T0 → T1
    const { rawToken: token1 } = await refreshTokenService.rotateRefreshToken(token0);

    // Attacker replays T0 (already revoked) — breach detection kicks in
    await expect(refreshTokenService.rotateRefreshToken(token0)).rejects.toThrow(UnauthorizedException);

    // The entire family must be revoked, including T1
    const familyTokens = await refreshTokenRepository.find({ where: { family } });
    expect(familyTokens.length).toBeGreaterThan(0);
    expect(familyTokens.every((t) => t.isRevoked)).toBe(true);

    const t1Record = await refreshTokenRepository.findOne({ where: { tokenHash: hashToken(token1) } });
    expect(t1Record!.isRevoked).toBe(true);
  });

  it('rotateRefreshToken: exceeds rotation limit → revokes family and throws', async () => {
    const user = await createUser(userRepository, { email: 'limit@test.com', name: 'Limit User' });
    const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);

    const record = await refreshTokenRepository.findOne({ where: { tokenHash: hashToken(rawToken) } });
    // Default maxRotations is 100; set count to the limit to trigger rejection
    await refreshTokenRepository.update(record!.id, { rotationCount: 100 });

    await expect(refreshTokenService.rotateRefreshToken(rawToken)).rejects.toThrow(UnauthorizedException);

    const familyTokens = await refreshTokenRepository.find({ where: { family: record!.family } });
    expect(familyTokens.every((t) => t.isRevoked)).toBe(true);
  });

  it('revokeByRawToken: marks the specific token as revoked', async () => {
    const user = await createUser(userRepository, { email: 'revoke@test.com', name: 'Revoke User' });
    const { rawToken } = await refreshTokenService.issueRefreshToken(user.id);

    await refreshTokenService.revokeByRawToken(rawToken);

    const record = await refreshTokenRepository.findOne({ where: { tokenHash: hashToken(rawToken) } });
    expect(record!.isRevoked).toBe(true);
  });

  it('revokeAllForUser: revokes all tokens belonging to the user', async () => {
    const user = await createUser(userRepository, { email: 'revokeall@test.com', name: 'Revoke All User' });
    await refreshTokenService.issueRefreshToken(user.id);
    await refreshTokenService.issueRefreshToken(user.id);
    await refreshTokenService.issueRefreshToken(user.id);

    await refreshTokenService.revokeAllForUser(user.id);

    const tokens = await refreshTokenRepository.find({ where: { userId: user.id } });
    expect(tokens).toHaveLength(3);
    expect(tokens.every((t) => t.isRevoked)).toBe(true);
  });

  it('deleteExpiredTokens: removes expired tokens and keeps active ones', async () => {
    const user = await createUser(userRepository, { email: 'cleanup@test.com', name: 'Cleanup User' });
    const { rawToken: activeRawToken } = await refreshTokenService.issueRefreshToken(user.id);
    const { rawToken: expiredRawToken } = await refreshTokenService.issueRefreshToken(user.id);

    await refreshTokenRepository.update(
      { tokenHash: hashToken(expiredRawToken) },
      { expiresAt: new Date('2000-01-01') },
    );

    await refreshTokenService.deleteExpiredTokens();

    const remaining = await refreshTokenRepository.find({ where: { userId: user.id } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].tokenHash).toBe(hashToken(activeRawToken));
  });
});
