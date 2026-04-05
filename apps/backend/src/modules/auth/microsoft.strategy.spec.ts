import { MicrosoftStrategy } from './microsoft.strategy';
import type { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

describe('MicrosoftStrategy', () => {
  let strategy: MicrosoftStrategy;
  let authService: { validateOrRejectMicrosoftUser: jest.Mock };
  let config: Partial<ConfigService>;

  beforeEach(() => {
    authService = {
      validateOrRejectMicrosoftUser: jest.fn(),
    };
    config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MICROSOFT_CLIENT_ID') return 'test-client-id';
        if (key === 'MICROSOFT_CLIENT_SECRET') return 'test-client-secret';
        if (key === 'MICROSOFT_CALLBACK_URL') return 'http://localhost:3000/api/auth/microsoft/callback';
        if (key === 'MICROSOFT_TENANT_ID') return 'common';
        return '';
      }),
    };
    strategy = new MicrosoftStrategy(config as ConfigService, authService as unknown as AuthService);
  });

  it('throws when profile invalid', async () => {
    const cb = jest.fn();
    const fakeReq = {} as unknown as Request;
    const invalidProfile = {} as Record<string, unknown>;

    await new Promise<void>((resolve) => {
      void strategy.validate(fakeReq, 'at', 'rt', invalidProfile as unknown as Express.User, (err, user) => {
        try {
          expect(err).toBeInstanceOf(Error);
          expect(user).toBeFalsy();
          cb();
        } finally {
          resolve();
        }
      });
    });
    expect(cb).toHaveBeenCalled();
  });

  it('calls authService for valid profile', async () => {
    const profile = {
      provider: 'microsoft',
      id: '1',
      emails: [{ value: 'a@b.com' }],
      displayName: 'Name',
    };
    authService.validateOrRejectMicrosoftUser.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'user' });

    const fakeReq = {} as unknown as Request;
    await new Promise<void>((resolve) => {
      void strategy.validate(fakeReq, 'at', 'rt', profile as unknown as Express.User, (err, user) => {
        try {
          expect(err).toBeNull();
          expect(user).toBeDefined();
          expect(authService.validateOrRejectMicrosoftUser).toHaveBeenCalledWith('a@b.com', 'Name');
        } finally {
          resolve();
        }
      });
    });
  });
});
