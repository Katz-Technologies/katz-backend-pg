import { Global, Module } from '@nestjs/common';
import { ExternalRedisAdapter } from './external-redis.adapter';
import { externalRedisProvider } from './external-redis.provider';
import { REDIS_TOKENS } from './redis.tokens';

@Global()
@Module({
  providers: [
    externalRedisProvider,
    ExternalRedisAdapter,
    {
      provide: REDIS_TOKENS.EXTERNAL,
      useExisting: ExternalRedisAdapter,
    },
  ],
  exports: [REDIS_TOKENS.EXTERNAL, ExternalRedisAdapter],
})
export class ExternalRedisModule {}
