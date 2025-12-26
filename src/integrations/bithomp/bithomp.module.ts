import { Module } from '@nestjs/common';
import { BithompService } from './bithomp.service';

@Module({
  providers: [BithompService],
  exports: [BithompService],
})
export class BithompModule {}
