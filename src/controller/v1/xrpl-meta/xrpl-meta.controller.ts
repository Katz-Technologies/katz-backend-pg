import { Controller, Get, Query } from '@nestjs/common';
import { XrplMetaService } from 'src/integrations/xrpl-meta/xrpl-meta.service';
import { GetTokensDto } from './dto/get-tokens.dto';
import { GetTokenDto } from './dto/get-token.dto';
import { IGetTokensResponse } from 'src/integrations/xrpl-meta/interface/get-tokens-response.interface';
import { IToken } from 'src/integrations/xrpl-meta/interface/get-tokens-response.interface';

@Controller('v1/xrpl-meta')
export class XrplMetaController {
  constructor(private readonly xrplMetaService: XrplMetaService) {}

  @Get('tokens')
  async getTokens(@Query() data?: GetTokensDto): Promise<IGetTokensResponse> {
    return this.xrplMetaService.getTokens(data);
  }

  @Get('token')
  async getTokenByAssetAndIssuer(@Query() data: GetTokenDto): Promise<IToken> {
    return this.xrplMetaService.getTokenByAssetAndIssuer(data);
  }
}
