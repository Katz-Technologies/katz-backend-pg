import { Module } from '@nestjs/common';
import { SmartMoneyService } from './smart-money.service';
import { ClickhouseModule } from '../../common/clickhouse/clickhouse.module';
import { ExternalRedisModule } from '../../common/redis/external-redis.module';
import { ProcessMoneyFlowRowsDomainModule } from 'src/domain/process-money-flow-rows/process-money-flow-rows.domain.module';
import { TagsDomainModule } from 'src/domain/tags/tags.domain.module';
import { BalancesVolumesDomainModule } from 'src/domain/balances-volumes/balances-volumes.domain.module';
import { SalesDomainModule } from 'src/domain/sales/sales.domain.module';

@Module({
  imports: [
    ClickhouseModule,
    ExternalRedisModule,
    ProcessMoneyFlowRowsDomainModule,
    TagsDomainModule,
    BalancesVolumesDomainModule,
    SalesDomainModule,
  ],
  providers: [SmartMoneyService],
  exports: [SmartMoneyService],
})
export class SmartMoneyModule {}
