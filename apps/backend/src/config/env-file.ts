import { existsSync } from 'node:fs';
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
 * The environment file to load, refusing a production file that only a developer's machine would have.
 *
 * Production has no environment file: Render exports the variables itself. An `.env.production` on
 * disk is therefore a local copy of the real credentials, and any entry point that read it under
 * `NODE_ENV=production` — `node dist/main`, `start:prod:migrate`, the compiled DataSource — would be
 * talking to the live database from a laptop. The compiled paths are exactly the ones data-source.ts's
 * own guard lets through (it only refuses the TypeScript CLI), so the check has to live here, in front
 * of every loader. `NODE_ENV` alone cannot be the criterion, since Render boots with it too: what
 * separates Render from a laptop is whether the file exists (issue #179).
 */
export const resolveEnvFile = (
  nodeEnv: string = process.env.NODE_ENV || 'development',
  file: string = envFilePath(nodeEnv),
): string => {
  if (nodeEnv === 'production' && existsSync(file)) {
    throw new Error(
      `Refusing to start with NODE_ENV=production while ${file} exists.\n` +
        'Production reads its variables from the platform (Render) and ships no .env.production; a ' +
        'local copy holds the real credentials, so this would connect to the live database. Unset ' +
        'NODE_ENV to run against your local database.',
    );
  }

  return file;
};

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

  const nodeEnv = process.env.NODE_ENV || 'development';
  // In production the fix is never to create the file: that is the copy resolveEnvFile refuses.
  const hint =
    nodeEnv === 'production'
      ? 'Production reads its variables from the platform; export them, do not create .env.production.'
      : `Read from ${envFile} (NODE_ENV=${nodeEnv}).\n` +
        'Copy .env.example to that file, or export the variables before running this command.';

  throw new Error(`Missing database configuration: ${missing.join(', ')}.\n${hint}`);
};
