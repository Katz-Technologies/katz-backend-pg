import { Controller, Get, Query } from '@nestjs/common';
import { GeckoTerminalService } from 'src/service/gecko-terminal/gecko-terminal.service';
import { GetLast24hVolumeDto } from './dto/get-last-24h-volume.dto';

@Controller('v1/gecko-terminal')
export class GeckoTerminalController {
  constructor(private readonly geckoTerminalService: GeckoTerminalService) {}
  @Get('last-24h-volume')
  async getLast24hVolume(@Query() asset: GetLast24hVolumeDto) {
    return this.geckoTerminalService.getLast24hVolume(asset);
  }
}
