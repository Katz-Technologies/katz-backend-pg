import { Module } from '@nestjs/common';
import { BithompController } from './bithomp.controller';
import { BithompModule } from 'src/integrations/bithomp/bithomp.module';

@Module({
  controllers: [BithompController],
  imports: [BithompModule],
})
export class BithompControllerModule {}
