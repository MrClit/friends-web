/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 *
 * Todas las variables de entorno deben estar definidas aquí
 * para tener autocompletado y type-safety.
 */

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;

  // Feature Flags
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_DEBUG: string;

  // App Metadata
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
