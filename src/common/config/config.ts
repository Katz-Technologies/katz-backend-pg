import type { IAppConfig } from './config.interface';

export const Config = (): IAppConfig => {
  return {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    externalRedis: {
      host: process.env.EXTERNAL_REDIS_HOST || 'localhost',
      port: Number(process.env.EXTERNAL_REDIS_PORT) || 6379,
      keys: {
        challengeTokens: 'challenge-token',
        country: 'country',
        avatar: 'avatar',
        reservedUsername: 'reserved-username',
      },
    },

    socket: {
      url: process.env.SOCKET_URL || 'http://localhost:3001',
      topics: process.env.SOCKET_TOPICS
        ? process.env.SOCKET_TOPICS.split(',').map((topic) => topic.trim())
        : [],
    },

    localRedis: {
      host: process.env.INTERNAL_REDIS_HOST || 'localhost',
      port: Number(process.env.INTERNAL_REDIS_PORT) || 6379,
      keys: {
        challengeTokens: 'challenge-token',
        country: 'country',
        avatar: 'avatar',
        reservedUsername: 'reserved-username',
      },
    },

    clickhouse: {
      host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USERNAME || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
      database: process.env.CLICKHOUSE_DATABASE || 'xrpl',
      requestTimeout: Number(process.env.CLICKHOUSE_REQUEST_TIMEOUT) || 600000,
      maxOpenConnections: Number(process.env.CLICKHOUSE_MAX_CONNECTIONS) || 10,
      keepAlive: process.env.CLICKHOUSE_KEEP_ALIVE !== 'false',
      compression: process.env.CLICKHOUSE_COMPRESSION !== 'false',
    },

    throttler: {
      limit: Number(process.env.THROTTLER_LIMIT) || 60,
      ttl: Number(process.env.THROTTLER_TTL) || 60000,
    },
  };
};
