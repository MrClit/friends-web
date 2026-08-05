import { INestApplication } from '@nestjs/common';
import { configureApp } from '../../src/common/bootstrap/configure-app';

/**
 * Applies the same configuration the production bootstrap uses, so tests exercise the real
 * middleware stack (security headers included) instead of a divergent copy of it.
 */
export function applyAppTestConfig(app: INestApplication): void {
  configureApp(app);
}
