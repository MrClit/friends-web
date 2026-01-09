import 'dotenv/config';
import { DataSource } from 'typeorm';
// No importar entidades directamente, usar rutas glob absolutas

// Usar rutas absolutas para TypeORM CLI
// Esto asegura que los imports funcionen correctamente desde la raíz
// Si hay problemas, se puede usar require en vez de import

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['src/modules/**/entities/*.entity.{ts,js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
