import { Global, Module } from '@nestjs/common';
import { InternalRedisAdapter } from './internal-redis.adapter';
import { internalRedisProvider } from './internal-redis.provider';
import { REDIS_TOKENS } from './redis.tokens';

@Global()
@Module({
  providers: [
    internalRedisProvider,
    InternalRedisAdapter,
    {
      provide: REDIS_TOKENS.INTERNAL,
      useExisting: InternalRedisAdapter,
    },
  ],
  exports: [REDIS_TOKENS.INTERNAL, InternalRedisAdapter],
})
export class InternalRedisModule {}
