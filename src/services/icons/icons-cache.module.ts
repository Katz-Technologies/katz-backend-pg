import { Module } from '@nestjs/common';
import { IconsCacheService } from './icons-cache.service';
import { IconOptimizerService } from './icon-optimizer.service';
import { IconsService } from './icons.service';
import { HashiconDetectorService } from './hashicon-detector.service';
import { InternalRedisModule } from '../../common/redis/internal-redis.module';
// import { ExternalRedisModule } from '../../common/redis/external-redis.module';
import { BithompModule } from '../../integrations/bithomp/bithomp.module';

@Module({
  imports: [InternalRedisModule, BithompModule],
  // imports: [InternalRedisModule, ExternalRedisModule, BithompModule],
  providers: [
    IconsCacheService,
    IconOptimizerService,
    IconsService,
    HashiconDetectorService,
  ],
  exports: [
    IconsCacheService,
    IconOptimizerService,
    HashiconDetectorService,
    IconsService,
  ],
})
export class IconsCacheModule {}
