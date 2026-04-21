import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshToken } from '../entities/refresh-token.entity';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn((entity: RefreshToken) => entity),
      save: jest.fn().mockImplementation((entity: RefreshToken) => Promise.resolve(entity)),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn().mockReturnValue('30'),
    };

    service = new RefreshTokenService(
      repository as unknown as Repository<RefreshToken>,
      configService as unknown as ConfigService,
    );
  });

  it('issueRefreshToken saves entity and returns raw token and family', async () => {
    const result = await service.issueRefreshToken('user-1');

    expect(result.rawToken).toEqual(expect.any(String));
    expect(result.family).toEqual(expect.any(String));
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String) as unknown as string,
        family: expect.any(String) as unknown as string,
      }),
    );
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('rotateRefreshToken marks old token revoked and returns new token with user id', async () => {
    repository.findOne.mockResolvedValue({
      tokenHash: 'hash',
      userId: 'user-1',
      family: 'family-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await service.rotateRefreshToken('raw-token');

    expect(result.userId).toBe('user-1');
    expect(result.rawToken).toEqual(expect.any(String));
    expect(repository.save).toHaveBeenCalled();
  });

  it('rotateRefreshToken with revoked token revokes family and throws unauthorized', async () => {
    repository.findOne.mockResolvedValue({
      tokenHash: 'hash',
      userId: 'user-1',
      family: 'family-1',
      isRevoked: true,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const revokeFamilySpy = jest.spyOn(service, 'revokeFamilyTokens').mockResolvedValue(undefined);

    await expect(service.rotateRefreshToken('raw-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(revokeFamilySpy).toHaveBeenCalledWith('family-1');
  });

  it('rotateRefreshToken with expired token throws unauthorized', async () => {
    repository.findOne.mockResolvedValue({
      tokenHash: 'hash',
      userId: 'user-1',
      family: 'family-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(service.rotateRefreshToken('raw-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotateRefreshToken with unknown hash throws unauthorized', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.rotateRefreshToken('raw-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokeByRawToken marks token as revoked when found', async () => {
    repository.findOne.mockResolvedValue({
      tokenHash: 'hash',
      isRevoked: false,
    });

    await service.revokeByRawToken('raw-token');

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isRevoked: true,
      }),
    );
  });

  it('revokeFamilyTokens updates all family tokens', async () => {
    await service.revokeFamilyTokens('family-1');

    expect(repository.update).toHaveBeenCalledWith({ family: 'family-1' }, { isRevoked: true });
  });

  it('deleteExpiredTokens deletes expired rows', async () => {
    await service.deleteExpiredTokens();

    expect(repository.delete).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        expiresAt: expect.any(Object) as unknown as object,
      }),
    );
  });
});
