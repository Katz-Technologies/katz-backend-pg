import { Module } from '@nestjs/common';
import { BalancesVolumesDomain } from './balances-volumes.domain';

@Module({
  providers: [BalancesVolumesDomain],
  exports: [BalancesVolumesDomain],
})
export class BalancesVolumesDomainModule {}
