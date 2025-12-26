import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_TOKENS } from './redis.tokens';

export const externalRedisProvider: Provider = {
  provide: REDIS_TOKENS.EXTERNAL_CLIENT,
  useFactory: () => {
    const client = new Redis({
      host: process.env.EXTERNAL_REDIS_HOST || 'localhost',
      port: Number(process.env.EXTERNAL_REDIS_PORT) || 6379,
      retryStrategy: (times) => {
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
      if (error instanceof AggregateError || (error as any).errors) {
        const errors = (error as AggregateError).errors || [];
        const isConnectionError = errors.some(
          (e: any) =>
            e?.code === 'ECONNREFUSED' ||
            e?.code === 'ENOTFOUND' ||
            e?.message?.includes('ECONNREFUSED') ||
            e?.message?.includes('ENOTFOUND'),
        );
        if (isConnectionError) {
          return;
        }
      }

      if (
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        (error as any).code === 'ECONNREFUSED' ||
        (error as any).code === 'ENOTFOUND'
      ) {
        return;
      }
    });

    // Пытаемся подключиться, но не блокируем запуск приложения
    client.connect().catch(() => {
      // Ошибки подключения обрабатываются автоматически через retry стратегию
    });

    return client;
  },
};
