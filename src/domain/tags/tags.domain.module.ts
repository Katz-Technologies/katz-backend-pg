import { Module } from '@nestjs/common';
import { TagsDomain } from './tags.domain';

@Module({
  providers: [TagsDomain],
  exports: [TagsDomain],
})
export class TagsDomainModule {}
