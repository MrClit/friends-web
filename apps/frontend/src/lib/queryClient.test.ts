import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { queryClient } from './queryClient';

// Runs a query against the real client with no backoff and returns how many times it was tried.
async function attemptsFor(error: Error): Promise<number> {
  const queryFn = vi.fn().mockRejectedValue(error);
  await expect(
    queryClient.fetchQuery({ queryKey: ['retry-policy', error.message], queryFn, retryDelay: 0 }),
  ).rejects.toBe(error);
  return queryFn.mock.calls.length;
}

describe('queryClient retry policy', () => {
  beforeEach(() => {
    // The query cache subscriber logs every failed query.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it.each([400, 401, 403, 404])('requests once and gives up on a %i', async (status) => {
    expect(await attemptsFor(new ApiError(status, 'Error', `status ${status}`))).toBe(1);
  });

  it.each([0, 429, 500])('retries a %i three times', async (status) => {
    expect(await attemptsFor(new ApiError(status, 'Error', `status ${status}`))).toBe(4);
  });

  it('retries an error that is not an ApiError three times', async () => {
    expect(await attemptsFor(new Error('boom'))).toBe(4);
  });

  it('retries mutations once', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(1);
  });
});
