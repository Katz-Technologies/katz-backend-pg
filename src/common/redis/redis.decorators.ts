import { Inject } from '@nestjs/common';
import { REDIS_TOKENS } from './redis.tokens';

export const InjectExternalRedis = () => Inject(REDIS_TOKENS.EXTERNAL);
export const InjectInternalRedis = () => Inject(REDIS_TOKENS.INTERNAL);
