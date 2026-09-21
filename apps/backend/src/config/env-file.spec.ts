import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { assertDatabaseEnv, envFilePath, resolveEnvFile } from './env-file';

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

/**
 * Production has no environment file — Render exports the variables — so an `.env.production` on disk is
 * a developer's copy of the real credentials. The compiled entry points (`node dist/main`,
 * `start:prod:migrate`) are not covered by data-source.ts's TypeScript-only guard, and they would read
 * that file and connect to the live database (issue #179). The file is passed in explicitly, in a temp
 * directory, so these tests do not depend on what the developer's machine happens to have.
 */
describe('resolveEnvFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'env-file-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('refuses a production file that exists, naming it', () => {
    const file = path.join(dir, '.env.production');
    writeFileSync(file, 'DATABASE_HOST=live');

    expect(() => resolveEnvFile('production', file)).toThrow(/Refusing to start with NODE_ENV=production/);
    expect(() => resolveEnvFile('production', file)).toThrow(file);
  });

  // The Render path: NODE_ENV=production and nothing on disk. The path is still returned so the
  // loaders keep behaving as before (dotenv and ConfigModule both tolerate a missing file).
  it('returns the path in production when the file does not exist', () => {
    const file = path.join(dir, '.env.production');

    expect(resolveEnvFile('production', file)).toBe(file);
  });

  // Only the production file is a copy of live credentials; the others are meant to be on disk.
  it('returns an existing file for any other environment', () => {
    const file = path.join(dir, '.env.development');
    writeFileSync(file, 'DATABASE_HOST=localhost');

    expect(resolveEnvFile('development', file)).toBe(file);
  });

  // The unit suite runs under NODE_ENV=test, so the default resolves to the same file the app would load.
  it('defaults to the file for the current environment', () => {
    expect(resolveEnvFile()).toBe(envFilePath());
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

  // Telling someone to "copy .env.example to .env.production" would have them create the very file
  // resolveEnvFile refuses. In production the variables come from the platform, and the hint says so.
  it('does not suggest creating the file in production', () => {
    process.env.NODE_ENV = 'production';

    expect(() => assertDatabaseEnv()).toThrow(/export them, do not create \.env\.production/);
    expect(() => assertDatabaseEnv()).not.toThrow(/Copy \.env\.example/);
  });
});
