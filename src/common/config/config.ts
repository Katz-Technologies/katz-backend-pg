import type { IAppConfig, IRedisKeysConfig } from './config.interface';

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? Number(value) : defaultValue;
};

const getEnvString = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value !== 'false';
};

const getEnvArray = (key: string, defaultValue: string[]): string[] => {
  const value = process.env[key];
  return value ? value.split(',').map((topic) => topic.trim()) : defaultValue;
};

const getRedisKeys = (): IRedisKeysConfig => ({
  challengeTokens: 'challenge-token',
  country: 'country',
  avatar: 'avatar',
  reservedUsername: 'reserved-username',
});

export const Config = (): IAppConfig => {
  return {
    port: getEnvNumber('PORT', 3000),
    nodeEnv: getEnvString('NODE_ENV', 'development'),

    externalRedis: {
      host: getEnvString('EXTERNAL_REDIS_HOST', 'localhost'),
      port: getEnvNumber('EXTERNAL_REDIS_PORT', 6379),
      keys: getRedisKeys(),
    },

    socket: {
      url: getEnvString('SOCKET_URL', 'http://localhost:3001'),
      topics: getEnvArray('SOCKET_TOPICS', []),
    },

    localRedis: {
      host: getEnvString('INTERNAL_REDIS_HOST', 'localhost'),
      port: getEnvNumber('INTERNAL_REDIS_PORT', 6379),
      password: process.env.INTERNAL_REDIS_PASSWORD,
      keys: getRedisKeys(),
    },

    clickhouse: {
      host: getEnvString('CLICKHOUSE_HOST', 'http://localhost:8123'),
      username: getEnvString('CLICKHOUSE_USERNAME', 'default'),
      password: getEnvString('CLICKHOUSE_PASSWORD', ''),
      database: getEnvString('CLICKHOUSE_DATABASE', 'xrpl'),
      requestTimeout: getEnvNumber('CLICKHOUSE_REQUEST_TIMEOUT', 600000),
      maxOpenConnections: getEnvNumber('CLICKHOUSE_MAX_CONNECTIONS', 10),
      keepAlive: getEnvBoolean('CLICKHOUSE_KEEP_ALIVE', true),
      compression: getEnvBoolean('CLICKHOUSE_COMPRESSION', true),
    },

    throttler: {
      limit: getEnvNumber('THROTTLER_LIMIT', 60),
      ttl: getEnvNumber('THROTTLER_TTL', 60000),
    },
  };
};
