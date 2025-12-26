import { Controller, Get, Query, Param } from '@nestjs/common';
import { XrpScanService } from 'src/integrations/xrp-scan/xrp-scan.service';
import { GetAmmPoolsDto } from './dto/get-amm-pools.dto';
import { GetTokenDto } from './dto/get-token.dto';
import { IAmmPool } from 'src/integrations/xrp-scan/interface/amm-pool.interface';
import { IAmmInfo } from 'src/integrations/xrp-scan/interface/amm-info.interface';
import { ITokenInfo } from 'src/integrations/xrp-scan/interface/token-info.interface';

@Controller('v1/xrp-scan')
export class XrpScanController {
  constructor(private readonly xrpScanService: XrpScanService) {}

  @Get('amm/pools')
  async getAmmPools(@Query() data?: GetAmmPoolsDto): Promise<IAmmPool[]> {
    return this.xrpScanService.getAmmPools(data);
  }

  @Get('amm/:account')
  async getAmmPoolByAccount(
    @Param('account') account: string,
  ): Promise<IAmmInfo> {
    return this.xrpScanService.getAmmPoolByAccount(account);
  }

  @Get('token')
  async getTokenByAssetAndIssuer(
    @Query() data: GetTokenDto,
  ): Promise<ITokenInfo> {
    return this.xrpScanService.getTokenByAssetAndIssuer(data);
  }
}
