import { GoogleStrategy } from './google.strategy';
import type { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: { validateOrRejectGoogleUser: jest.Mock };
  let config: Partial<ConfigService>;

  beforeEach(() => {
    authService = {
      validateOrRejectGoogleUser: jest.fn(),
    };
    config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'test-client-id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'test-client-secret';
        if (key === 'GOOGLE_CALLBACK_URL') return 'http://localhost:3000/api/auth/google/callback';
        return '';
      }),
    };
    strategy = new GoogleStrategy(config as ConfigService, authService as unknown as AuthService);
  });

  it('throws when profile invalid', async () => {
    // call validate with invalid profile and assert it errors
    const cb = jest.fn();
    // Passport strategy `validate` expects (req, accessToken, refreshToken, profile, done)
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
      provider: 'google',
      id: '1',
      emails: [{ value: 'a@b.com' }],
      displayName: 'Name',
      photos: [{ value: 'avatar' }],
    };
    authService.validateOrRejectGoogleUser.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'user' });

    const fakeReq = {} as unknown as Request;
    await new Promise<void>((resolve) => {
      void strategy.validate(fakeReq, 'at', 'rt', profile as unknown as Express.User, (err, user) => {
        try {
          expect(err).toBeNull();
          expect(user).toBeDefined();
        } finally {
          resolve();
        }
      });
    });
  });
});
