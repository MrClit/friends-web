import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, MicrosoftStrategyOptionsWithRequest } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../auth.service';
import { Request } from 'express';
import { getDisplayName, getPrimaryEmail, hasOAuthIdentity } from '../../base/oauth-profile';
import { runOAuthValidation } from '../../base/oauth-validation.base';

type MicrosoftProfile = {
  provider: string;
  id: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
};

function isMicrosoftProfile(obj: unknown): obj is MicrosoftProfile {
  return hasOAuthIdentity(obj);
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    // addUPNAsEmail is supported by passport-microsoft at runtime but missing from @types/passport-microsoft
    const options = {
      clientID: config.get<string>('MICROSOFT_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('MICROSOFT_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('MICROSOFT_CALLBACK_URL') || 'http://localhost:3000/api/auth/microsoft/callback',
      scope: ['openid', 'profile', 'email', 'User.Read'],
      tenant: config.get<string>('MICROSOFT_TENANT_ID') || 'common',
      addUPNAsEmail: true,
      passReqToCallback: true,
    } as MicrosoftStrategyOptionsWithRequest;

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

    if (!isMicrosoftProfile(profileRaw)) {
      done(new Error('Invalid Microsoft profile object'), false);
      return;
    }

    const email = getPrimaryEmail(profileRaw);
    const name = getDisplayName(profileRaw);

    await runOAuthValidation(
      {
        email,
        missingEmailMessage: 'No email found in Microsoft profile',
      },
      {
        resolveUser: ({ email: resolvedEmail }) => this.authService.validateOrRejectMicrosoftUser(resolvedEmail, name),
        done,
      },
    );
  }
}
