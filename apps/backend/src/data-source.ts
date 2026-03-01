import 'dotenv/config';
import { DataSource } from 'typeorm';

// No importar entidades directamente, usar rutas glob absolutas
// Soporta rutas diferentes para desarrollo (TS) y producción (JS compilado)

const isProd = process.env.NODE_ENV === 'production';

const entitiesPath = isProd ? 'dist/modules/**/entities/*.entity.js' : 'src/modules/**/entities/*.entity.{ts,js}';

const migrationsPath = isProd ? 'dist/migrations/*.js' : 'src/migrations/*{.ts,.js}';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [entitiesPath],
  migrations: [migrationsPath],
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
