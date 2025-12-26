import { Module } from '@nestjs/common';
import { XrplMetaService } from './xrpl-meta.service';

@Module({ providers: [XrplMetaService], exports: [XrplMetaService] })
export class XrplMetaModule {}
