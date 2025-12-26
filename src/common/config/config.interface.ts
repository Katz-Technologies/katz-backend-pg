export interface IAppConfig {
  port: number;
  nodeEnv: string;

  clickhouse: IClickhouseConfig;
  externalRedis: IRedisConfig;
  localRedis: IRedisConfig;
  throttler: IThrottlerConfig;
  socket: ISocketConfig;
}

export interface ISocketConfig {
  url: string;
  topics: string[];
}

export interface IThrottlerConfig {
  ttl: number;
  limit: number;
}

export interface IRedisConfig {
  host: string;
  port: number;
  password?: string;
  keys: IRedisKeysConfig;
}

export interface IRedisKeysConfig {
  challengeTokens: string;
  country: string;
  avatar: string;
  reservedUsername: string;
}

export interface IClickhouseConfig {
  host: string;
  username: string;
  password: string;
  database: string;
  requestTimeout?: number;
  maxOpenConnections?: number;
  keepAlive?: boolean;
  compression?: boolean;
}
