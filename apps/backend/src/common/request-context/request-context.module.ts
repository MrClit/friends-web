import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

/**
 * Registers the AsyncLocalStorage wrapper once for the whole app. The middleware that writes the
 * correlation id and the services that read it must share a single instance: providing the service
 * in more than one module makes Nest instantiate it per module, and the stored context is lost.
 */
@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class RequestContextModule {}
