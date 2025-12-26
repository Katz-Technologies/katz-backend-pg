import { Module } from '@nestjs/common';
import { SologenicService } from './sologenic.service';

@Module({ providers: [SologenicService], exports: [SologenicService] })
export class SologenicModule {}
