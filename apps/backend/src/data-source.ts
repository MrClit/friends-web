import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENTITY_GLOB, MIGRATION_GLOB } from './config/typeorm-paths';

// The DataSource the TypeORM CLI runs with (migration:generate, migration:run, migration:revert).
// Entity and migration paths come from typeorm-paths.ts, shared with the application's own config so
// both always describe the same schema. They resolve from that file's directory, which is why nothing
// here branches on NODE_ENV or depends on the directory the CLI is invoked from.

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
