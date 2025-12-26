import { Module } from '@nestjs/common';
import { CoingeckoController } from './coingecko.controller';
import { CoingeckoModule } from 'src/service/coingecko/coingecko.module';

@Module({
  controllers: [CoingeckoController],
  imports: [CoingeckoModule],
})
export class CoingeckoControllerModule {}
