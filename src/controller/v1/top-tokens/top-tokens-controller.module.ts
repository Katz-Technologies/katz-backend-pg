import { Module } from '@nestjs/common';
import { TopTokensController } from './top-tokens.controller';
import { IconsCacheModule } from 'src/service/cron/icons-cache.module';
import { CronModule } from 'src/service/cron/cron.module';

@Module({
  controllers: [TopTokensController],
  imports: [IconsCacheModule, CronModule],
})
export class TopTokensControllerModule {}
