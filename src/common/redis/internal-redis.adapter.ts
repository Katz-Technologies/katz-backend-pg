import Redis, { ChainableCommander } from 'ioredis';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { RedisService } from './redis.service';
import { REDIS_TOKENS } from './redis.tokens';

@Injectable()
export class InternalRedisAdapter implements RedisService, OnModuleDestroy {
  private readyPromise: Promise<void>;

  constructor(
    @Inject(REDIS_TOKENS.INTERNAL_CLIENT) private readonly redis: Redis,
  ) {
    this.readyPromise = this.waitUntilReady();
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  async waitUntilReady(): Promise<void> {
    if (this.redis.status === 'ready') return;

    return new Promise((resolve, reject) => {
      this.redis.once('ready', resolve);
      this.redis.once('error', reject);
    });
  }

  async ensureReady(): Promise<void> {
    await this.readyPromise;
  }

  isReady(): boolean {
    return this.redis.status === 'ready';
  }

  async getJson<T>(key: string): Promise<T> {
    return JSON.parse((await this.redis.call('JSON.GET', key)) as string);
  }

  async scanKeys(pattern: string, count = 500): Promise<string[]> {
    const found: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, keys] = (await this.redis.call(
        'SCAN',
        cursor,
        'MATCH',
        pattern,
        ...(count ? ['COUNT', count] : []),
      )) as [string, string[]];

      if (keys?.length) found.push(...keys);
      cursor = nextCursor;
    } while (cursor !== '0');

    return found;
  }

  async getAsJson<T>(key: string): Promise<T> {
    return JSON.parse((await this.redis.get(key))!);
  }

  async setJson<T>(key: string, data: T): Promise<void> {
    await this.redis.call('JSON.SET', key, '$', JSON.stringify(data));
  }

  async setAsJson<T>(key: string, data: T): Promise<void> {
    await this.redis.set(key, JSON.stringify(data));
  }

  async setAsJsonEx<T>(key: string, data: T, expire: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(data), 'EX', expire);
  }

  async delKey(key: string): Promise<void> {
    await this.redis.del(key);
  }

  pipelineWithJson(): {
    delKey: (
      key: string,
    ) => ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']>;
    setAsJsonEx: <T>(
      key: string,
      data: T,
      expire: number,
    ) => ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']>;
    exec: () => Promise<[Error | null, unknown][] | null>;
  } {
    const pipeline = this.redis.pipeline();

    return {
      delKey: (
        key: string,
      ): ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']> => {
        pipeline.del(key);
        return this.pipelineWithJsonProxy(pipeline);
      },
      setAsJsonEx: <T>(
        key: string,
        data: T,
        expire: number,
      ): ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']> => {
        pipeline.set(key, JSON.stringify(data), 'EX', expire);
        return this.pipelineWithJsonProxy(pipeline);
      },
      exec: (): Promise<[Error | null, unknown][] | null> => pipeline.exec(),
    };
  }

  private pipelineWithJsonProxy(pipeline: ReturnType<Redis['pipeline']>): {
    delKey: (
      key: string,
    ) => ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']>;
    setAsJsonEx: <T>(
      key: string,
      data: T,
      expire: number,
    ) => ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']>;
    exec: () => Promise<[Error | null, unknown][] | null>;
  } {
    return {
      delKey: (
        key: string,
      ): ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']> => {
        pipeline.del(key);
        return this.pipelineWithJsonProxy(pipeline);
      },
      setAsJsonEx: <T>(
        key: string,
        data: T,
        expire: number,
      ): ReturnType<InternalRedisAdapter['pipelineWithJsonProxy']> => {
        pipeline.set(key, JSON.stringify(data), 'EX', expire);
        return this.pipelineWithJsonProxy(pipeline);
      },
      exec: (): Promise<[Error | null, unknown][] | null> => pipeline.exec(),
    };
  }

  async call(...args: [string, ...unknown[]]): Promise<unknown> {
    return this.redis.call(...(args as [string, ...string[]]));
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ...args: unknown[]
  ): Promise<'OK' | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.redis.set(key, value, ...(args as any[]));
  }

  async del(...keys: string[]): Promise<number> {
    return this.redis.del(...keys);
  }

  multi(options?: { pipeline: false }): Promise<'OK'>;
  multi(): ChainableCommander;
  multi(options: { pipeline: true }): ChainableCommander;
  multi(commands?: unknown[][]): ChainableCommander;
  multi(
    options?: { pipeline: false } | { pipeline: true } | unknown[][],
  ): Promise<'OK'> | ChainableCommander {
    if (options === undefined) {
      return this.redis.multi();
    }
    if (Array.isArray(options)) {
      return this.redis.multi(options);
    }
    if (options.pipeline === false) {
      return this.redis.multi({ pipeline: false });
    }
    if (options.pipeline === true) {
      return this.redis.multi({ pipeline: true });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.redis.multi(options as any);
  }

  pipeline(commands?: unknown[][]): ChainableCommander {
    return this.redis.pipeline(commands);
  }
}
