import { Module } from '@nestjs/common';
import { TopTokensController } from './top-tokens.controller';
import { IconsCacheModule } from 'src/services/icons/icons-cache.module';
import { CronModule } from 'src/jobs/cron.module';

@Module({
  controllers: [TopTokensController],
  imports: [IconsCacheModule, CronModule],
})
export class TopTokensControllerModule {}
