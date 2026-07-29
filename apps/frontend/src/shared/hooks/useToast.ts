import { useTranslation } from 'react-i18next';
import type { TOptions } from 'i18next';
import { useToastStore } from '@/shared/store/useToastStore';

/**
 * Interpolation options accepted by the toast helpers. Bare `TOptions` types `context` as
 * `unknown`, which `t()` rejects since i18next 25.10 — narrow it to what `t()` actually takes.
 */
type ToastOptions = Omit<TOptions, 'context'> & { context?: string };

export function useToast() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  return {
    success: (messageKey: string, descriptionKey?: string, duration?: number, options?: ToastOptions) =>
      addToast({
        type: 'success',
        message: t(messageKey, options),
        description: descriptionKey ? t(descriptionKey, options) : undefined,
        duration: duration ?? 4000,
      }),
    error: (messageKey: string, descriptionKey?: string, options?: ToastOptions) =>
      addToast({
        type: 'error',
        message: t(messageKey, options),
        description: descriptionKey ? t(descriptionKey, options) : undefined,
        duration: 6000,
      }),
    info: (messageKey: string, descriptionKey?: string, options?: ToastOptions) =>
      addToast({
        type: 'info',
        message: t(messageKey, options),
        description: descriptionKey ? t(descriptionKey, options) : undefined,
        duration: 3000,
      }),
  };
}
