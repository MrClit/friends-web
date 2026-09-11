import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { describeLoadError, shouldRetryQuery } from './apiError';

// Echoes the key so the assertions read as the translation key being chosen.
const t = ((key: string) => key) as unknown as TFunction;

describe('shouldRetryQuery', () => {
  it.each([400, 401, 403, 404])('never retries a %i', (status) => {
    expect(shouldRetryQuery(0, new ApiError(status, 'Error', 'Error'))).toBe(false);
  });

  it.each([0, 429, 500])('retries a %i up to three times', (status) => {
    const error = new ApiError(status, 'Error', 'Error');
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(true);
    expect(shouldRetryQuery(3, error)).toBe(false);
  });

  it('retries an error that is not an ApiError up to three times', () => {
    expect(shouldRetryQuery(0, new Error('boom'))).toBe(true);
    expect(shouldRetryQuery(3, new Error('boom'))).toBe(false);
  });
});

describe('describeLoadError', () => {
  it('presents a 400 as an invalid link without retry', () => {
    expect(describeLoadError(new ApiError(400, 'Bad Request', 'Validation failed'), t)).toEqual({
      message: 'invalidLink',
      isRetryable: false,
    });
  });

  it.each([403, 404])('presents a %i as not found or no access without retry', (status) => {
    expect(describeLoadError(new ApiError(status, 'Error', 'Error'), t)).toEqual({
      message: 'notFoundOrNoAccess',
      isRetryable: false,
    });
  });

  it.each([0, 401, 500])('keeps the generic message and the retry for a %i', (status) => {
    expect(describeLoadError(new ApiError(status, 'Error', 'Error'), t)).toEqual({
      message: undefined,
      isRetryable: true,
    });
  });

  it('keeps the generic message and the retry for an error that is not an ApiError', () => {
    expect(describeLoadError(new Error('boom'), t)).toEqual({ message: undefined, isRetryable: true });
  });
});
