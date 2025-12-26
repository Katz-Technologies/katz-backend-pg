import { Module } from '@nestjs/common';
import { GeckoTerminalService } from './gecko-terminal.service';

@Module({
  providers: [GeckoTerminalService],
  exports: [GeckoTerminalService],
})
export class GeckoTerminalModule {}
