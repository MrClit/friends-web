import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/shared/store/useToastStore';

export function useToast() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  return {
    success: (messageKey: string, descriptionKey?: string, duration?: number) =>
      addToast({
        type: 'success',
        message: t(messageKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        duration: duration ?? 3000,
      }),
    error: (messageKey: string, descriptionKey?: string) =>
      addToast({
        type: 'error',
        message: t(messageKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        duration: 5000,
      }),
    info: (messageKey: string, descriptionKey?: string) =>
      addToast({
        type: 'info',
        message: t(messageKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        duration: 3000,
      }),
  };
}
