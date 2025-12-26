import { Module } from '@nestjs/common';
import { XrpScanController } from './xrp-scan.controller';
import { XrpScanModule } from 'src/integrations/xrp-scan/xrp-scan.module';

@Module({
  controllers: [XrpScanController],
  imports: [XrpScanModule],
})
export class XrpScanControllerModule {}
