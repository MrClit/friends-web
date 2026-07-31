import type { JwtSignOptions } from '@nestjs/jwt';

/** Access token lifetime, as accepted by `jsonwebtoken`: an `ms` duration string or seconds. */
export type JwtExpiration = NonNullable<JwtSignOptions['expiresIn']>;

/**
 * Default access token lifetime.
 *
 * Kept short on purpose: refresh token rotation covers renewal transparently, so a leaked
 * access token stays useful for minutes instead of a full day.
 *
 * Single source of truth for the `JWT_EXPIRATION` default — consumed both by the env
 * validation schema and by the JwtModule factory, so the two cannot drift apart.
 */
export const DEFAULT_JWT_EXPIRATION: JwtExpiration = '15m';
