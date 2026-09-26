import { QueryFailedError } from 'typeorm';

interface PostgresError extends Error {
  code?: string;
}

/** Whether a failed query broke a unique constraint (Postgres error 23505). */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  return (error as PostgresError).code === '23505';
}
