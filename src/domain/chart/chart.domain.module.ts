import { Module } from '@nestjs/common';
import { ChartDomain } from './chart.domain';

@Module({
  providers: [ChartDomain],
  exports: [ChartDomain],
})
export class ChartDomainModule {}
