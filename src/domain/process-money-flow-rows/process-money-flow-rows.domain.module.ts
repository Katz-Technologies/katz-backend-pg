import { Module } from '@nestjs/common';
import { ProcessMoneyFlowRowsDomain } from './process-money-flow-rows.domain';

@Module({
  providers: [ProcessMoneyFlowRowsDomain],
  exports: [ProcessMoneyFlowRowsDomain],
})
export class ProcessMoneyFlowRowsDomainModule {}
