import { config as loadEnv } from 'dotenv';
import { envFilePath } from './config/env-file';

jest.mock('dotenv', () => ({ config: jest.fn() }));

const loadEnvMock = loadEnv as jest.MockedFunction<typeof loadEnv>;

/**
 * The DataSource the migration CLI runs with used to load its environment with `dotenv/config`, which
 * reads a plain `.env` — a file this repo does not have, since the real ones are `.env.development`,
 * `.env.test` and `.env.production`. Every local `pnpm migration:run` therefore connected with no host,
 * user or password at all (issue #149).
 *
 * dotenv is mocked because the file the module would read is gitignored: asserting against it would
 * pass on a developer's machine and fail in CI.
 */
describe('migration DataSource', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    loadEnvMock.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // The module has to be re-evaluated per test, since everything under test happens at import time.
  // `jest.isolateModules` runs its callback synchronously, so `require` is the only way in.
  const importDataSource = (): void => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./data-source');
    });
  };

  it('loads the file for the current environment, not a plain .env', () => {
    process.env.NODE_ENV = 'test';

    importDataSource();

    expect(loadEnvMock).toHaveBeenCalledWith({ path: envFilePath('test'), quiet: true });
  });

  // No `override`: on Render the variables come from the platform and there is no .env.production, so
  // whatever is already exported has to win over anything a file might carry.
  it('never overrides variables the environment already carries', () => {
    importDataSource();

    expect(loadEnvMock).not.toHaveBeenCalledWith(expect.objectContaining({ override: true }));
  });

  // typeorm-paths.spec.ts imports this module in the unit suite, which has no database configuration
  // in CI. The missing-configuration guard must stay out of that path.
  it('can be imported under NODE_ENV=test with no database configuration', () => {
    process.env.NODE_ENV = 'test';

    expect(() => importDataSource()).not.toThrow();
  });

  // The path a developer is on when the environment file is missing or incomplete: the whole point of
  // the guard is that this says what is missing instead of pg's "client password must be a string".
  it('reports the missing configuration outside the test environment', () => {
    process.env.NODE_ENV = 'development';
    ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'].forEach(
      (name) => delete process.env[name],
    );

    expect(() => importDataSource()).toThrow(/Missing database configuration/);
  });

  // `.env.production` holds the deployment's real credentials, so reading it from a laptop means
  // connecting to the live database. A NODE_ENV left exported in a shell must not be enough to migrate
  // production. This spec runs from source (.ts), which is exactly the CLI path being refused;
  // production runs the compiled file and never reaches it.
  describe('with NODE_ENV=production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('refuses to run the TypeScript CLI against production', () => {
      expect(() => importDataSource()).toThrow(/Refusing to run the TypeScript migration CLI/);
    });

    it('aborts before loading the file, so the credentials never reach the process', () => {
      expect(() => importDataSource()).toThrow();
      expect(loadEnvMock).not.toHaveBeenCalled();
    });
  });
});
