import { Inject } from '@nestjs/common';
import { REDIS_TOKENS } from './redis.tokens';

export const InjectExternalRedis = (): ReturnType<typeof Inject> =>
  Inject(REDIS_TOKENS.EXTERNAL);
export const InjectInternalRedis = (): ReturnType<typeof Inject> =>
  Inject(REDIS_TOKENS.INTERNAL);
