import { join } from 'node:path';

/**
 * The single description of which environment file this backend reads, and of what it needs to find
 * in it before it can talk to the database.
 *
 * The rule used to live in two places that drifted: app.module.ts resolved `.env.${NODE_ENV}`, while
 * data-source.ts imported `dotenv/config`, which looks for a plain `.env` — a file this repo does not
 * have. The migration CLI therefore ran with an empty configuration and died on `pg`'s
 * "client password must be a string", a message that points at credentials rather than at the file
 * that was never read (issue #149).
 *
 * The path resolves from this file's own location, not from the working directory, so the same value
 * works under ts-node (`src/config/`) and compiled (`dist/config/` — the build is flat, so `../..` is
 * the package root either way) and from wherever the command is invoked.
 */

/** Database variables without which no DataSource in this backend can connect. */
const REQUIRED_DATABASE_VARS = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'] as const;

export const envFilePath = (nodeEnv: string = process.env.NODE_ENV || 'development'): string =>
  join(__dirname, '..', '..', `.env.${nodeEnv}`);

/**
 * Fails with the cause instead of the symptom when the database configuration is incomplete.
 *
 * Reads `process.env`, so it is satisfied either by the environment file or by variables the platform
 * already exported — which is how production works: Render sets them itself and ships no
 * `.env.production`.
 */
export const assertDatabaseEnv = (envFile: string = envFilePath()): void => {
  const missing = REQUIRED_DATABASE_VARS.filter((name) => !process.env[name]);

  if (missing.length === 0) return;

  throw new Error(
    `Missing database configuration: ${missing.join(', ')}.\n` +
      `Read from ${envFile} (NODE_ENV=${process.env.NODE_ENV || 'development'}).\n` +
      `Copy .env.example to that file, or export the variables before running this command.`,
  );
};
