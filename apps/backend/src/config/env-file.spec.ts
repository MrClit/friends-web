import * as path from 'node:path';
import { assertDatabaseEnv, envFilePath } from './env-file';

/**
 * The migration CLI used to read a plain `.env`, a file this repo does not have, so every local
 * `migration:run` connected with an empty configuration and failed on a SASL error that named the
 * password instead of the missing file (issue #149). These tests pin the two properties that keep that
 * from coming back: the path is the same `.env.${NODE_ENV}` the application boots with, anchored at the
 * package root rather than at the working directory, and an incomplete configuration is reported as
 * such before anything tries to connect.
 */
describe('envFilePath', () => {
  const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('names the file after the environment', () => {
    expect(path.normalize(envFilePath('production'))).toBe(path.join(PACKAGE_ROOT, '.env.production'));
  });

  it('reads NODE_ENV when no environment is given', () => {
    process.env.NODE_ENV = 'test';

    expect(path.normalize(envFilePath())).toBe(path.join(PACKAGE_ROOT, '.env.test'));
  });

  // The CLI scripts do not set NODE_ENV, so `pnpm migration:run` lands here. The default has to match
  // app.module.ts's, or the migration would run against a different database than the dev server.
  it('falls back to development when NODE_ENV is unset', () => {
    delete process.env.NODE_ENV;

    expect(path.normalize(envFilePath())).toBe(path.join(PACKAGE_ROOT, '.env.development'));
  });

  // Anchored at this file's directory, not at the caller's: pnpm, the TypeORM CLI and the test runner
  // are each invoked from a different place.
  it('is absolute, so the working directory cannot change it', () => {
    expect(path.isAbsolute(envFilePath('development'))).toBe(true);
  });
});

describe('assertDatabaseEnv', () => {
  const DATABASE_VARS = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'] as const;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    DATABASE_VARS.forEach((name) => delete process.env[name]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const setAll = () => DATABASE_VARS.forEach((name) => (process.env[name] = 'value'));

  it('passes once every variable is present', () => {
    setAll();

    expect(() => assertDatabaseEnv('/somewhere/.env.development')).not.toThrow();
  });

  it('names the variables that are missing and the file it read', () => {
    setAll();
    delete process.env.DATABASE_PASSWORD;
    delete process.env.DATABASE_NAME;

    expect(() => assertDatabaseEnv('/somewhere/.env.development')).toThrow(
      /Missing database configuration: DATABASE_PASSWORD, DATABASE_NAME/,
    );
    expect(() => assertDatabaseEnv('/somewhere/.env.development')).toThrow(/\/somewhere\/\.env\.development/);
  });

  // The empty-configuration case: what the migration CLI actually hit, and where the SASL error came from.
  it('reports all four when nothing was loaded', () => {
    expect(() => assertDatabaseEnv()).toThrow(/DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME/);
  });

  // An empty string is what a variable declared with no value in an env file produces, and `pg` fails
  // on it exactly like on an absent one.
  it('treats an empty value as missing', () => {
    setAll();
    process.env.DATABASE_PASSWORD = '';

    expect(() => assertDatabaseEnv()).toThrow(/DATABASE_PASSWORD/);
  });
});
