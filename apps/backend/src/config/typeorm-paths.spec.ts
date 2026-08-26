import * as fs from 'node:fs';
import * as path from 'node:path';
import { ConfigService } from '@nestjs/config';
import dataSource from '../data-source';
import { getDatabaseConfig } from './database.config';
import { ENTITY_GLOB, MIGRATION_GLOB } from './typeorm-paths';

/**
 * The application and the migration CLI must see the same schema. They used to describe it with two
 * separate literals, which drifted: the CLI's pattern required every entity to sit inside an
 * `entities/` directory, so it silently missed modules/users/user.entity.ts.
 *
 * These tests pin the three properties that keep them from drifting again: the pattern reaches every
 * entity in the tree, both DataSources actually use the shared constant, and the constant still
 * resolves from the root of src/.
 */
describe('TypeORM paths', () => {
  const SRC_ROOT = path.resolve(__dirname, '..');

  describe('ENTITY_GLOB', () => {
    it('matches every entity file in the source tree', () => {
      // The reference is a directory walk rather than another glob: comparing a pattern against a
      // pattern would assert nothing. (fs.globSync is Node's own; TypeORM resolves these patterns
      // with glob@10 internally, which is a transitive dependency and must not be imported here.
      // Both expand the `{.ts,.js}` braces the same way for the syntax used.)
      const walked = fs
        .readdirSync(SRC_ROOT, { recursive: true, encoding: 'utf8' })
        .filter((entry) => entry.endsWith('.entity.ts'))
        .map((entry) => path.resolve(SRC_ROOT, entry))
        .sort();

      const matched = fs
        .globSync(ENTITY_GLOB)
        .map((entry) => path.resolve(entry))
        .sort();

      expect(walked.length).toBeGreaterThan(0);
      expect(matched).toEqual(walked);
    });

    // The entity that started all this: it lives directly under its module, not under an entities/
    // directory, and any pattern that assumes otherwise leaves the users table unmanaged.
    it('reaches an entity that is not inside an entities directory', () => {
      const matched = fs.globSync(ENTITY_GLOB).map((entry) => path.resolve(entry));

      expect(matched).toContain(path.join(SRC_ROOT, 'modules', 'users', 'user.entity.ts'));
    });
  });

  describe('consumers', () => {
    it('is what the migration CLI DataSource is built with', () => {
      expect(dataSource.options.entities).toEqual([ENTITY_GLOB]);
      expect(dataSource.options.migrations).toEqual([MIGRATION_GLOB]);
    });

    it('is what the application DataSource is built with', () => {
      const config = getDatabaseConfig(new ConfigService());

      expect(config.entities).toEqual([ENTITY_GLOB]);
      expect(config.migrations).toEqual([MIGRATION_GLOB]);
    });
  });

  // The patterns resolve from this file's directory, so its location decides what they reach. Moving
  // typeorm-paths.ts one level deeper would narrow them without breaking anything visible today.
  it('resolves from the root of the source tree', () => {
    // Normalized before comparing: the constants are built by concatenation, keeping the exact shape
    // the application has been running with in production, so they still carry the '/config/..' hop.
    expect(path.normalize(ENTITY_GLOB)).toBe(path.join(SRC_ROOT, '**', '*.entity{.ts,.js}'));
    expect(path.normalize(MIGRATION_GLOB)).toBe(path.join(SRC_ROOT, 'migrations', '*{.ts,.js}'));
  });
});
