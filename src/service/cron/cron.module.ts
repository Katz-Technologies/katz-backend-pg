import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { TokensService } from './tokens.service';
import { IconsService } from './icons.service';
import { IconsCacheModule } from './icons-cache.module';
import { XrplMetaModule } from '../xrpl-meta/xrpl-meta.module';
import { BithompModule } from '../bithomp/bithomp.module';
import { ClickhouseModule } from 'src/common/clickhouse/clickhouse.module';
import { NewTokenModule } from '../new-token/new-token.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    IconsCacheModule,
    XrplMetaModule,
    BithompModule,
    NewTokenModule,
    ClickhouseModule,
  ],
  providers: [CronService, TokensService, IconsService],
  exports: [CronService, IconsService],
})
export class CronModule {}
