import { QueryFailedError } from 'typeorm';

interface PostgresError extends Error {
  code?: string;
}

function hasPostgresCode(error: unknown, code: string): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  return (error as PostgresError).code === code;
}

/** Whether a failed query broke a unique constraint (Postgres error 23505). */
export function isUniqueViolation(error: unknown): boolean {
  return hasPostgresCode(error, '23505');
}

/** Whether a failed query broke a foreign key, such as deleting a row still referenced (Postgres 23503). */
export function isForeignKeyViolation(error: unknown): boolean {
  return hasPostgresCode(error, '23503');
}
