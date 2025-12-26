import { Injectable } from '@nestjs/common';
import { InternalRedisAdapter } from 'src/common/redis/internal-redis.adapter';

@Injectable()
export class NewTokenService {
  constructor(private readonly redisService: InternalRedisAdapter) {}

  saveNewTokens(newTokens) {
    return this.redisService.setAsJsonEx('new-tokens:list', newTokens, 120);
  }

  getNewTokens() {
    return this.redisService.getAsJson('new-tokens:list');
  }
}
