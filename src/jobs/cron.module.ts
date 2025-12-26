import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { TokensModule } from '../services/tokens/tokens.module';
import { IconsCacheModule } from '../services/icons/icons-cache.module';
import { XrplMetaModule } from '../integrations/xrpl-meta/xrpl-meta.module';
import { BithompModule } from '../integrations/bithomp/bithomp.module';
import { ClickhouseModule } from '../common/clickhouse/clickhouse.module';
import { NewTokenModule } from '../services/new-token/new-token.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    IconsCacheModule,
    XrplMetaModule,
    BithompModule,
    NewTokenModule,
    ClickhouseModule,
    TokensModule,
  ],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
