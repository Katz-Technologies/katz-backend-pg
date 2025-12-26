import { Module } from '@nestjs/common';
import { XrpScanService } from './xrp-scan.service';

@Module({ providers: [XrpScanService], exports: [XrpScanService] })
export class XrpScanModule {}
