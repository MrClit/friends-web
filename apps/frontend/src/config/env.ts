/**
 * Environment Configuration
 *
 * Centraliza todas las variables de entorno con parsing y validación.
 * Importa desde aquí en lugar de usar import.meta.env directamente.
 */

// Parse boolean strings
const parseBoolean = (value: string | undefined): boolean => {
  return value === 'true';
};

// Environment configuration object
export const ENV = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL,

  // Feature Flags
  ENABLE_DEVTOOLS: parseBoolean(import.meta.env.VITE_ENABLE_DEVTOOLS),
  ENABLE_ANALYTICS: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS),
  DEBUG: parseBoolean(import.meta.env.VITE_DEBUG),

  // App Metadata
  APP_NAME: import.meta.env.VITE_APP_NAME,
  APP_VERSION: import.meta.env.VITE_APP_VERSION,

  // Vite built-in variables
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
} as const;

// Runtime validation (only in development)
if (ENV.IS_DEV) {
  const requiredVars = ['API_URL', 'APP_NAME'] as const;

  requiredVars.forEach((varName) => {
    if (!ENV[varName]) {
      console.error(`⚠️  Missing required environment variable: VITE_${varName}`);
    }
  });

  // Log configuration in development
  console.log('🔧 Environment Configuration:', {
    mode: ENV.MODE,
    apiUrl: ENV.API_URL,
    devtools: ENV.ENABLE_DEVTOOLS,
    debug: ENV.DEBUG,
  });
}

// Type-safe environment object
export type EnvironmentConfig = typeof ENV;
