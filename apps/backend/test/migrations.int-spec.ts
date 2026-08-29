import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITY_GLOB, MIGRATION_GLOB } from '../src/config/typeorm-paths';
import { EXPECTED_INDEXES, readIndexNamesByTable } from './utils/expected-indexes';

/**
 * The only place the migration SQL runs today is the backend's startup on Render
 * (`start:prod:migrate`), which happens *after* the merge to `main`. A broken migration is therefore
 * not caught by a PR, by CI or locally — it is caught when the deploy fails to boot and the API stays
 * down. The other DB-backed suites cannot catch it either: they build the schema from the entities
 * with TYPEORM_SYNC=true, so `src/migrations/` is never executed.
 *
 * This suite is that missing pre-merge check. Against a throwaway, empty database it applies every
 * migration, reverts the most recent one and re-applies it — which is exactly what DEPLOYMENT.md asks
 * to verify before merging: that the SQL is valid and that the `down()` of what is about to be
 * deployed exists and works.
 *
 * What it does not prove, so that nobody reads more into a green run than is there:
 *
 * - Nothing about production *data*. The database is empty, so a migration that fails on the rows
 *   already out there (a NOT NULL over a column with nulls, a unique index over duplicates) still
 *   passes here. That review is still the reviewer's.
 * - Not that `down()` actually undoes `up()`. It is asserted to run without error, and `up()` is
 *   asserted to survive running again afterwards — but an `up()` written to be idempotent, like
 *   1706000000000, re-applies cleanly even over an empty `down()`. Verified by hand: emptying that
 *   migration's `down()` does not fail this suite.
 * - Only the most recent migration is reverted. The older ones are exercised upwards only, which is
 *   deliberate: 1705200000000's `down()` is a documented no-op, so a full unwind cannot pass.
 *
 * The last test does prove one thing about the resulting schema: that its indexes are the ones
 * test/utils/expected-indexes.ts lists. db-indexes.int-spec.ts asserts that same list against the
 * schema the entities build, so an index added to only one of the two sides fails a suite instead of
 * drifting apart in silence (issue #150).
 *
 * The schema is built here by the migrations, never by `synchronize`. Nothing in this file touches the
 * database the rest of the suites share.
 */

// This suite does not boot AppModule, which is what normally loads `.env.test`, and none of the jest
// configs declare setupFiles — so the env has to be loaded here. No `override`: whatever CI already
// exported wins.
loadEnv({ path: join(__dirname, '..', `.env.${process.env.NODE_ENV ?? 'test'}`), quiet: true });

const DATABASE_NAME = process.env.DATABASE_NAME ?? 'friends_db_test';

// Derived from the configured database instead of a new env var, so `.env.test.example` and the Joi
// schema stay untouched.
const MIGRATION_DATABASE_NAME = `${DATABASE_NAME}_migrations`;

const connectionOptions = (database: string): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database,
  // The same patterns the production DataSource runs with (src/config/typeorm-paths.ts), so this
  // suite can never test a different set of migrations than the one Render applies.
  entities: [ENTITY_GLOB],
  migrations: [MIGRATION_GLOB],
  synchronize: false,
  migrationsRun: false,
  logging: false,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const HOOK_TIMEOUT = 60_000;

/** Runs DDL that cannot target the database it connects to, against the server's default database. */
const withAdminConnection = async (run: (admin: DataSource) => Promise<void>): Promise<void> => {
  const admin = new DataSource(connectionOptions('postgres'));
  await admin.initialize();

  try {
    await run(admin);
  } finally {
    await admin.destroy();
  }
};

describe('Migrations (integration)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    await withAdminConnection(async (admin) => {
      // FORCE (PostgreSQL 13+, and both CI and docker-compose run 17) drops the database even if an
      // aborted previous run left a connection behind.
      await admin.query(`DROP DATABASE IF EXISTS "${MIGRATION_DATABASE_NAME}" WITH (FORCE);`);
      await admin.query(`CREATE DATABASE "${MIGRATION_DATABASE_NAME}";`);
    });

    dataSource = new DataSource(connectionOptions(MIGRATION_DATABASE_NAME));
    await dataSource.initialize();
  }, HOOK_TIMEOUT);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    await withAdminConnection(async (admin) => {
      await admin.query(`DROP DATABASE IF EXISTS "${MIGRATION_DATABASE_NAME}" WITH (FORCE);`);
    });
  }, HOOK_TIMEOUT);

  // The three tests below share the database and run in declaration order (the suite is executed with
  // --runInBand): each one starts from the schema the previous one left. Do not reorder them or turn
  // them into `it.concurrent` — in particular, the index assertion is only meaningful once every
  // migration has been applied.

  it(
    'applies every migration to an empty database',
    async () => {
      // A glob that matches nothing would make every assertion below pass vacuously, and it has already
      // happened once — see the docblock in src/config/typeorm-paths.ts.
      expect(dataSource.migrations.length).toBeGreaterThan(0);

      const applied = await dataSource.runMigrations();

      expect(applied).toHaveLength(dataSource.migrations.length);
      await expect(dataSource.showMigrations()).resolves.toBe(false);
    },
    HOOK_TIMEOUT,
  );

  it(
    'reverts and re-applies the most recent migration',
    async () => {
      await dataSource.undoLastMigration();

      await expect(dataSource.showMigrations()).resolves.toBe(true);

      const reapplied = await dataSource.runMigrations();

      expect(reapplied).toHaveLength(1);
      await expect(dataSource.showMigrations()).resolves.toBe(false);
    },
    HOOK_TIMEOUT,
  );

  it(
    'leaves exactly the expected indexes behind',
    async () => {
      const actual = await readIndexNamesByTable((sql) => dataSource.query(sql));

      expect(actual).toEqual(EXPECTED_INDEXES);
    },
    HOOK_TIMEOUT,
  );
});
