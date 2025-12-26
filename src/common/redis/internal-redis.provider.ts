import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_TOKENS } from './redis.tokens';

export const internalRedisProvider: Provider = {
  provide: REDIS_TOKENS.INTERNAL_CLIENT,
  useFactory: () => {
    const client = new Redis({
      host: process.env.INTERNAL_REDIS_HOST || 'localhost',
      port: Number(process.env.INTERNAL_REDIS_PORT) || 6379,
      retryStrategy: (times): number => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      showFriendlyErrorStack: false,
      enableAutoPipelining: false,
    });

    client.on('error', (error: Error | AggregateError) => {
      if (error instanceof AggregateError || 'errors' in error) {
        const errors = (error as AggregateError).errors || [];
        const isConnectionError = errors.some((e: unknown) => {
          if (e && typeof e === 'object') {
            const err = e as { code?: string; message?: string };
            return (
              err.code === 'ECONNREFUSED' ||
              err.code === 'ENOTFOUND' ||
              err.message?.includes('ECONNREFUSED') ||
              err.message?.includes('ENOTFOUND')
            );
          }
          return false;
        });
        if (isConnectionError) {
          return;
        }
      }

      const errorObj = error as { code?: string };
      if (
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        errorObj.code === 'ECONNREFUSED' ||
        errorObj.code === 'ENOTFOUND'
      ) {
        return;
      }
    });

    client.connect().catch(() => {});

    return client;
  },
};
