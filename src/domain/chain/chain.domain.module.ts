import { Module } from '@nestjs/common';
import { ChainDomain } from './chain.domain';

@Module({
  providers: [ChainDomain],
  exports: [ChainDomain],
})
export class ChainDomainModule {}
