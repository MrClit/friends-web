import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import type { ValidationError } from 'joi';
import { envValidationSchema } from './env.validation';
import { DEFAULT_JWT_EXPIRATION } from './auth.constants';

/** Minimal set of required vars, so each test only varies the one under test. */
const baseEnv = {
  DATABASE_HOST: 'localhost',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: 'postgres',
  DATABASE_NAME: 'friends_db',
  JWT_SECRET: 'a'.repeat(32),
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  MICROSOFT_CLIENT_ID: 'microsoft-client-id',
  MICROSOFT_CLIENT_SECRET: 'microsoft-client-secret',
  CLOUDINARY_CLOUD_NAME: 'cloud-name',
  CLOUDINARY_API_KEY: 'api-key',
  CLOUDINARY_API_SECRET: 'api-secret',
};

/** Joi types the validated value as `any`; narrow it to the vars under test. */
type ValidationOutcome = { error?: ValidationError; value: { JWT_EXPIRATION: string } };

const validate = (env: Record<string, unknown>): ValidationOutcome =>
  envValidationSchema.validate(env, { abortEarly: false });

describe('envValidationSchema', () => {
  describe('JWT_EXPIRATION', () => {
    it('defaults to a short-lived access token when the variable is absent', () => {
      const { error, value } = validate(baseEnv);

      expect(error).toBeUndefined();
      expect(value.JWT_EXPIRATION).toBe(DEFAULT_JWT_EXPIRATION);
      expect(value.JWT_EXPIRATION).toBe('15m');
    });

    it('lets an explicit value override the default', () => {
      const { error, value } = validate({ ...baseEnv, JWT_EXPIRATION: '30m' });

      expect(error).toBeUndefined();
      expect(value.JWT_EXPIRATION).toBe('30m');
    });
  });

  // The example files are what a fresh clone copies into .env.development / .env.test, so a schema
  // change that they do not follow makes the backend unbootable and the DB-backed suites unrunnable.
  describe('example env files', () => {
    it.each(['.env.example', '.env.test.example'])('%s satisfies the schema as-is', (fileName) => {
      const parsed = dotenv.parse(readFileSync(join(__dirname, '..', '..', fileName)));

      // allowUnknown: the examples may document variables the schema does not own.
      const { error } = envValidationSchema.validate(parsed, { abortEarly: false, allowUnknown: true });

      expect(error).toBeUndefined();
    });
  });
});
