import { Controller, Get, Query } from '@nestjs/common';
import { XrplMetaService } from 'src/service/xrpl-meta/xrpl-meta.service';
import { GetTokensDto } from './dto/get-tokens.dto';
import { GetTokenDto } from './dto/get-token.dto';

@Controller('v1/xrpl-meta')
export class XrplMetaController {
  constructor(private readonly xrplMetaService: XrplMetaService) {}

  @Get('tokens')
  async getTokens(@Query() data?: GetTokensDto) {
    return this.xrplMetaService.getTokens(data);
  }

  @Get('token')
  async getTokenByAssetAndIssuer(@Query() data: GetTokenDto) {
    return this.xrplMetaService.getTokenByAssetAndIssuer(data);
  }
}
