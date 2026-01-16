/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Request } from 'express';

function isProfile(obj: unknown): obj is Profile {
  return typeof obj === 'object' && obj !== null && 'provider' in obj && 'id' in obj;
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
    req: Request,
    accessToken: string,
    refreshToken: string,
    profileRaw: unknown,
    done: (err: any, user?: any) => void,
  ) {
    if (!isProfile(profileRaw)) {
      done(new Error('Invalid Google profile object'), false);
      return;
    }

    const profile = profileRaw;
    const email: string | undefined =
      Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value : undefined;
    const name: string | undefined = typeof profile.displayName === 'string' ? profile.displayName : undefined;
    const avatar: string | undefined =
      Array.isArray(profile.photos) && profile.photos.length > 0 ? profile.photos[0].value : undefined;
    try {
      if (!email) throw new Error('No email found in Google profile');
      const user = await this.authService.validateOrRejectGoogleUser(email, name, avatar);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
