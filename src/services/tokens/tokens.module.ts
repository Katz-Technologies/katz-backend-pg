import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { XrplMetaModule } from '../../integrations/xrpl-meta/xrpl-meta.module';

@Module({
  imports: [XrplMetaModule],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
