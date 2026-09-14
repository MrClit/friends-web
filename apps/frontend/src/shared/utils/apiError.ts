import type { TFunction } from 'i18next';
import { ApiError } from '@/api/client';

export function getApiErrorMessage(error: unknown, t: TFunction): string {
  if (!(error instanceof ApiError)) return t('errors.default', { ns: 'common' });
  if (error.status === 0) return t('network_error', { ns: 'common' });
  const mapped = t(`errors.${error.status}`, { ns: 'common', defaultValue: '' });
  return mapped || t('errors.default', { ns: 'common' });
}

const MAX_QUERY_RETRIES = 3;
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404]);

/**
 * Default `retry` for queries, the single owner of the automatic retry rule. A 400 (malformed id),
 * 403 (actor is not a participant) or 404 fails because of the link or the actor, and a 401 has
 * already been refreshed and replayed by the API client, so repeating the request cannot succeed.
 * Anything else (server errors, a 429, a network failure with status 0, unknown errors) may be
 * transient and gets up to 3 retries.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && NON_RETRYABLE_STATUSES.has(error.status)) return false;
  return failureCount < MAX_QUERY_RETRIES;
}

export interface LoadErrorPresentation {
  /** Translated message for ErrorState; undefined lets it fall back to the generic one. */
  message: string | undefined;
  /** Whether repeating the request could succeed. */
  isRetryable: boolean;
}

/**
 * How a failed load of an event resource should be presented. The single owner of the rule:
 * a 400 (malformed id in the URL), 403 (actor is not a participant) or 404 fail because of the
 * link or the actor, so repeating the same request can never fix them and no retry is offered.
 * 403 and 404 share a message on purpose — telling them apart would reveal that the event exists.
 * Everything else (server errors, a network failure with status 0, unknown errors) may be
 * transient and keeps the retry.
 */
export function describeLoadError(error: unknown, t: TFunction): LoadErrorPresentation {
  if (!(error instanceof ApiError)) return { message: undefined, isRetryable: true };
  if (error.status === 400) return { message: t('invalidLink', { ns: 'common' }), isRetryable: false };
  if (error.status === 403 || error.status === 404) {
    return { message: t('notFoundOrNoAccess', { ns: 'common' }), isRetryable: false };
  }
  return { message: undefined, isRetryable: true };
}
