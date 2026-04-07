import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { preloadI18nNamespaces } from '@/i18n';
import type { I18nNamespace } from '@/i18n/namespaces';

export function useI18nNamespacesReady(namespaces: readonly I18nNamespace[]): boolean {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const preload = async () => {
      setIsReady(false);

      try {
        await preloadI18nNamespaces(namespaces);
      } finally {
        if (!isCancelled) {
          setIsReady(true);
        }
      }
    };

    void preload();

    return () => {
      isCancelled = true;
    };
  }, [i18n.resolvedLanguage, namespaces]);

  return isReady;
}
