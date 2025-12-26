import { Module } from '@nestjs/common';
import { SologenicController } from './sologenic.controller';
import { SologenicModule } from 'src/service/sologenic/sologenic.module';

@Module({
  controllers: [SologenicController],
  imports: [SologenicModule],
})
export class SologenicControllerModule {}
