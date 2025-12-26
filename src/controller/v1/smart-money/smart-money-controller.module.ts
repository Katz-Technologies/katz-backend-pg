import { Module } from '@nestjs/common';
import { SmartMoneyController } from './smart-money.controller';
import { SmartMoneyModule } from '../../../service/smart_money/smart-money.module';
import { NewTokenModule } from 'src/service/new-token/new-token.module';

@Module({
  imports: [SmartMoneyModule, NewTokenModule],
  controllers: [SmartMoneyController],
})
export class SmartMoneyControllerModule {}
