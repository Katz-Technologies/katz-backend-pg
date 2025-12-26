import { Module } from '@nestjs/common';
import { NewTokenService } from './new-token.service';

@Module({
  providers: [NewTokenService],
  exports: [NewTokenService],
})
export class NewTokenModule {}
