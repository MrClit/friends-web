import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../auth.service';
import { Request } from 'express';
import { getDisplayName, getPrimaryEmail, getPrimaryPhoto, hasOAuthIdentity } from '../../base/oauth-profile';
import { runOAuthValidation } from '../../base/oauth-validation.base';

function isProfile(obj: unknown): obj is Profile {
  return hasOAuthIdentity(obj);
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const options: StrategyOptions = {
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/auth/google/callback',
      scope: ['profile', 'email'],
      passReqToCallback: true,
    };

    // Reason: passport-google-oauth20 Strategy constructor is not strictly typed, but this call is safe.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(options);
  }

  async validate(
    _req: Request,
    accessToken: string,
    refreshToken: string,
    profileRaw: unknown,
    done: (err: any, user?: any) => void,
  ) {
    void accessToken;
    void refreshToken;

    if (!isProfile(profileRaw)) {
      done(new Error('Invalid Google profile object'), false);
      return;
    }

    const email = getPrimaryEmail(profileRaw);
    const name = getDisplayName(profileRaw);
    const avatar = getPrimaryPhoto(profileRaw);

    await runOAuthValidation(
      {
        email,
        missingEmailMessage: 'No email found in Google profile',
      },
      {
        resolveUser: ({ email: resolvedEmail }) =>
          this.authService.validateOrRejectGoogleUser(resolvedEmail, name, avatar),
        done,
      },
    );
  }
}
