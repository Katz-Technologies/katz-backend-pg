import { Injectable } from '@nestjs/common';
import { InternalRedisAdapter } from 'src/common/redis/internal-redis.adapter';
import { NewTokenList } from './interface/new-token.interface';

@Injectable()
export class NewTokenService {
  constructor(private readonly redisService: InternalRedisAdapter) {}

  saveNewTokens(newTokens: NewTokenList): Promise<void> {
    return this.redisService.setAsJsonEx('new-tokens:list', newTokens, 120);
  }

  getNewTokens(): Promise<NewTokenList | null> {
    return this.redisService.getAsJson<NewTokenList | null>('new-tokens:list');
  }
}
