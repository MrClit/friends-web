import { GoogleStrategy } from './oauth/google/google.strategy';
import { MicrosoftStrategy } from './oauth/microsoft/microsoft.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';

export const AUTH_STRATEGIES = [GoogleStrategy, MicrosoftStrategy, JwtStrategy] as const;
