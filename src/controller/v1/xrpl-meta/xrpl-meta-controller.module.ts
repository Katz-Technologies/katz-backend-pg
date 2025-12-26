import { Module } from '@nestjs/common';
import { XrplMetaController } from './xrpl-meta.controller';
import { XrplMetaModule } from 'src/integrations/xrpl-meta/xrpl-meta.module';

@Module({
  controllers: [XrplMetaController],
  imports: [XrplMetaModule],
})
export class XrplMetaControllerModule {}
