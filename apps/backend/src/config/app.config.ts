import { ConfigService } from '@nestjs/config';

const REQUIRED_VARS = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

function validateEnv(configService: ConfigService) {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const missing: string[] = [];
  for (const v of REQUIRED_VARS) {
    const val = configService.get<string>(v);
    if (!val) missing.push(v);
  }

  if (missing.length) {
    const message = `Missing required env vars: ${missing.join(', ')}`;
    if (nodeEnv === 'production') {
      throw new Error(message);
    }
    // In non-production environments log a warning to help developers
    // (ConfigService isn't available at module import time in tests, so keep this simple)

    console.warn(`[Config] ${message}`);
  }
}

export const getAppConfig = (configService: ConfigService) => {
  validateEnv(configService);
  return {
    port: configService.get<number>('PORT') || 3000,
    nodeEnv: configService.get<string>('NODE_ENV') || 'development',
    corsOrigin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173',
  };
};
