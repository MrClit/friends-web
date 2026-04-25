import type { TFunction } from 'i18next';
import { ApiError } from '@/api/client';

export function getApiErrorMessage(error: unknown, t: TFunction): string {
  if (!(error instanceof ApiError)) return t('errors.default', { ns: 'common' });
  if (error.status === 0) return t('network_error', { ns: 'common' });
  const mapped = t(`errors.${error.status}`, { ns: 'common', defaultValue: '' });
  return mapped || t('errors.default', { ns: 'common' });
}
