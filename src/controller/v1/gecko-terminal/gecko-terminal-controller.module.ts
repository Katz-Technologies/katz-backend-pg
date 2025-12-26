import { Module } from '@nestjs/common';
import { GeckoTerminalController } from './gecko-terminal.controller';
import { GeckoTerminalModule } from 'src/integrations/gecko-terminal/gecko-terminal-service.module';

@Module({
  controllers: [GeckoTerminalController],
  imports: [GeckoTerminalModule],
})
export class GeckoTerminalControllerModule {}
