import { useTranslation } from 'react-i18next';
import type { TOptions } from 'i18next';
import { useToastStore } from '@/shared/store/useToastStore';

export function useToast() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  return {
    success: (messageKey: string, descriptionKey?: string, duration?: number, options?: TOptions) =>
      addToast({
        type: 'success',
        message: t(messageKey, options),
        description: descriptionKey ? t(descriptionKey, options) : undefined,
        duration: duration ?? 4000,
      }),
    error: (messageKey: string, descriptionKey?: string, options?: TOptions) =>
      addToast({
        type: 'error',
        message: t(messageKey, options),
        description: descriptionKey ? t(descriptionKey, options) : undefined,
        duration: 6000,
      }),
    info: (messageKey: string, descriptionKey?: string, options?: TOptions) =>
      addToast({
        type: 'info',
        message: t(messageKey, options),
        description: descriptionKey ? t(descriptionKey, options) : undefined,
        duration: 3000,
      }),
  };
}
