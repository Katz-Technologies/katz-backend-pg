import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ExternalRedisModule } from '../../common/redis/external-redis.module';
import { ClickhouseModule } from '../../common/clickhouse/clickhouse.module';

@Module({
  imports: [ExternalRedisModule, ClickhouseModule],
  controllers: [HealthController],
})
export class HealthModule {}
