import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { assertDatabaseEnv, envFilePath } from './config/env-file';
import { ENTITY_GLOB, MIGRATION_GLOB } from './config/typeorm-paths';

// The DataSource the TypeORM CLI runs with (migration:generate, migration:run, migration:revert).
//
// Nothing boots Nest here, so the environment has to be loaded by hand — and from the same
// `.env.${NODE_ENV}` the application reads (config/env-file.ts), not from a plain `.env`, which this
// repo does not have. No `override`: whatever Render or CI already exported wins, and a missing file
// is not an error, which is exactly the production path (dist/data-source.js with no .env.production).
loadEnv({ path: envFilePath(), quiet: true });

// Skipped under NODE_ENV=test on purpose, and not cosmetically: typeorm-paths.spec.ts imports this
// module in the unit suite, which runs without a database and without an .env.test in CI. The
// DB-backed suites build their own DataSource, so they never reach this line either.
if (process.env.NODE_ENV !== 'test') {
  assertDatabaseEnv();
}

// Entity and migration paths come from typeorm-paths.ts, shared with the application's own config so
// both always describe the same schema. They resolve from that file's directory, which is why nothing
// here depends on the directory the CLI is invoked from.

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [ENTITY_GLOB],
  migrations: [MIGRATION_GLOB],
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
