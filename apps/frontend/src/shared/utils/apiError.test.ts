import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { describeLoadError } from './apiError';

// Echoes the key so the assertions read as the translation key being chosen.
const t = ((key: string) => key) as unknown as TFunction;

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
