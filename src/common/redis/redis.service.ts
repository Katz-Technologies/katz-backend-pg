import { ChainableCommander } from 'ioredis';

export interface RedisService {
  waitUntilReady(): Promise<void>;
  ensureReady(): Promise<void>;
  isReady(): boolean;
  getJson<T>(key: string): Promise<T>;
  getAsJson<T>(key: string): Promise<T>;
  scanKeys(pattern: string, count?: number): Promise<string[]>;
  setJson<T>(key: string, data: T): Promise<void>;
  setAsJson<T>(key: string, data: T): Promise<void>;
  setAsJsonEx<T>(key: string, data: T, expire: number): Promise<void>;
  delKey(key: string): Promise<void>;
  pipelineWithJson(): {
    delKey: (key: string) => ReturnType<RedisService['pipelineWithJson']>;
    setAsJsonEx: <T>(
      key: string,
      data: T,
      expire: number,
    ) => ReturnType<RedisService['pipelineWithJson']>;
    exec: () => Promise<[Error | null, unknown][] | null>;
  };
  call(...args: unknown[]): Promise<unknown>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<'OK' | null>;
  del(...keys: string[]): Promise<number>;
  multi(options?: { pipeline: false }): Promise<'OK'>;
  multi(): ChainableCommander;
  multi(options: { pipeline: true }): ChainableCommander;
  multi(commands?: unknown[][]): ChainableCommander;
  multi(
    options?: { pipeline: false } | { pipeline: true } | unknown[][],
  ): Promise<'OK'> | ChainableCommander;
  pipeline(commands?: unknown[][]): ChainableCommander;
}
