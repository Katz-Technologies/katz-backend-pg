import { Module } from '@nestjs/common';
import { SalesDomain } from './sales.domain';
import { ChainDomainModule } from '../chain/chain.domain.module';

@Module({
  imports: [ChainDomainModule],
  providers: [SalesDomain],
  exports: [SalesDomain],
})
export class SalesDomainModule {}
