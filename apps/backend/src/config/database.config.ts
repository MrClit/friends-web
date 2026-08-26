import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ENTITY_GLOB, MIGRATION_GLOB } from './typeorm-paths';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: [ENTITY_GLOB],
  synchronize: configService.get<boolean>('TYPEORM_SYNC') === true,
  logging: configService.get<boolean>('TYPEORM_LOGGING') === true,
  migrations: [MIGRATION_GLOB],
  ssl: configService.get<boolean>('DATABASE_SSL') === true ? { rejectUnauthorized: false } : false,
});
