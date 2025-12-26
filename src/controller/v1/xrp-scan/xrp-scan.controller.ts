import { Controller, Get, Query, Param } from '@nestjs/common';
import { XrpScanService } from 'src/service/xrp-scan/xrp-scan.service';
import { GetAmmPoolsDto } from './dto/get-amm-pools.dto';
import { GetTokenDto } from './dto/get-token.dto';

@Controller('v1/xrp-scan')
export class XrpScanController {
  constructor(private readonly xrpScanService: XrpScanService) {}

  @Get('amm/pools')
  async getAmmPools(@Query() data?: GetAmmPoolsDto) {
    return this.xrpScanService.getAmmPools(data);
  }

  @Get('amm/:account')
  async getAmmPoolByAccount(@Param('account') account: string) {
    return this.xrpScanService.getAmmPoolByAccount(account);
  }

  @Get('token')
  async getTokenByAssetAndIssuer(@Query() data: GetTokenDto) {
    return this.xrpScanService.getTokenByAssetAndIssuer(data);
  }
}
