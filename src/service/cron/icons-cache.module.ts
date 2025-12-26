import { Module } from '@nestjs/common';
import { IconsCacheService } from './icons-cache.service';
import { IconOptimizerService } from './icon-optimizer.service';
import { IconsService } from './icons.service';
import { HashiconDetectorService } from './hashicon-detector.service';
import { InternalRedisModule } from '../../common/redis/internal-redis.module';
import { BithompModule } from '../bithomp/bithomp.module';

@Module({
  imports: [InternalRedisModule, BithompModule],
  providers: [
    IconsCacheService,
    IconOptimizerService,
    IconsService,
    HashiconDetectorService,
  ],
  exports: [IconsCacheService, IconOptimizerService, HashiconDetectorService],
})
export class IconsCacheModule {}
