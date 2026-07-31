import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { Repository } from 'typeorm';
import { AuthExchangeCodeService } from './auth-exchange-code.service';
import { AuthExchangeCode } from '../entities/auth-exchange-code.entity';

const hashCode = (rawCode: string): string => createHash('sha256').update(rawCode).digest('hex');

// `expect.any` is typed as `any`; this alias keeps the matcher usable inside object literals.
const anyObject = expect.any(Object) as unknown as object;

describe('AuthExchangeCodeService', () => {
  let service: AuthExchangeCodeService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    returning: jest.Mock;
    execute: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let savedCodes: AuthExchangeCode[];

  beforeEach(() => {
    savedCodes = [];

    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    repository = {
      create: jest.fn((entity: AuthExchangeCode) => entity),
      save: jest.fn().mockImplementation((entity: AuthExchangeCode) => {
        savedCodes.push(entity);
        return Promise.resolve(entity);
      }),
      delete: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    configService = {
      get: jest.fn().mockReturnValue('60'),
    };

    service = new AuthExchangeCodeService(
      repository as unknown as Repository<AuthExchangeCode>,
      configService as unknown as ConfigService,
    );
  });

  it('issueCode stores the SHA-256 hash, never the raw code', async () => {
    const { rawCode } = await service.issueCode('user-1');

    expect(rawCode).toEqual(expect.any(String));
    expect(rawCode.length).toBeGreaterThanOrEqual(64);

    const saved = savedCodes[0];
    expect(saved.codeHash).toBe(hashCode(rawCode));
    expect(saved.codeHash).not.toBe(rawCode);
    expect(saved.userId).toBe('user-1');
  });

  it('issueCode applies the configured TTL to expiresAt', async () => {
    configService.get.mockReturnValue('120');
    const before = Date.now();

    await service.issueCode('user-1');

    const saved = savedCodes[0];
    const ttlMs = saved.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThanOrEqual(119_000);
    expect(ttlMs).toBeLessThanOrEqual(121_000);
  });

  it('issueCode falls back to 60 seconds when the TTL config is invalid', async () => {
    configService.get.mockReturnValue('not-a-number');
    const before = Date.now();

    await service.issueCode('user-1');

    const saved = savedCodes[0];
    const ttlMs = saved.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThanOrEqual(59_000);
    expect(ttlMs).toBeLessThanOrEqual(61_000);
  });

  it('consumeCode returns the owning user id when the atomic update wins', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 1, raw: [{ user_id: 'user-1' }] });

    await expect(service.consumeCode('raw-code')).resolves.toBe('user-1');

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'code_hash = :codeHash AND consumed_at IS NULL AND expires_at > NOW()',
      { codeHash: hashCode('raw-code') },
    );
  });

  it('consumeCode throws UnauthorizedException when no row is updated (unknown, expired or consumed)', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 0, raw: [] });

    await expect(service.consumeCode('raw-code')).rejects.toThrow(UnauthorizedException);
  });

  it('deleteExpiredCodes deletes rows past their expiration', async () => {
    await service.deleteExpiredCodes();

    expect(repository.delete).toHaveBeenCalledWith({ expiresAt: anyObject });
  });
});
