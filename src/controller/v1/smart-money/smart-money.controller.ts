import {
  Controller,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { AnalyzeAccountDto } from './dto/req-analyze-account.dto';
import { SmartMoneyService } from '../../../services/smart-money/smart-money.service';
import { ReqTokenHistoryDto } from './dto/req-token-history.dto';
import { NewTokenService } from 'src/services/new-token/new-token.service';
import { SaleData } from 'src/services/smart-money/type/sale-data.type';
import { MoneyFlowRow } from 'src/services/smart-money/interface/money-flow-row.interface';
import { TokenSummary } from 'src/services/smart-money/type/token-summary.type';
import { NewTokenList } from 'src/services/new-token/interface/new-token.interface';
import { TopTokenData } from 'src/services/smart-money/type/top-token-data.type';
import { TokenChartsResponse } from 'src/services/smart-money/interface/token-charts-response.interface';
import { SmartMoneySummary } from 'src/services/smart-money/type/smart-money-summary.type';

@Controller('v1/smart-money')
export class SmartMoneyController {
  constructor(
    private readonly smartMoneyService: SmartMoneyService,
    private readonly newTokenService: NewTokenService,
  ) {}

  @Get('sales')
  async getSales(@Query() data: AnalyzeAccountDto): Promise<SaleData[]> {
    try {
      return await this.smartMoneyService.getSales(
        data.address,
        data.limit,
        data.offset,
      );
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('token-history')
  async getTokenHistory(
    @Query() data: ReqTokenHistoryDto,
  ): Promise<MoneyFlowRow[]> {
    try {
      return await this.smartMoneyService.getTokenHistoryFromRedis(
        data.asset,
        data.limit,
        data.offset,
      );
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('token-summary/:asset')
  async getTokenSummary(
    @Param('asset') asset: string,
  ): Promise<TokenSummary | null> {
    try {
      return await this.smartMoneyService.getTokenSummary(asset);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('new-tokens')
  async getNewTokens(): Promise<NewTokenList | null> {
    try {
      return await this.newTokenService.getNewTokens();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tokens')
  async getAllTokens(): Promise<string[]> {
    try {
      return await this.smartMoneyService.getAllTokens();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('top-holders-tokens')
  async getTopVolumeTokens(): Promise<TopTokenData[]> {
    try {
      return await this.smartMoneyService.getTopVolumeTokens();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('money-flows')
  async getMoneyFlows(
    @Query() data: AnalyzeAccountDto,
  ): Promise<MoneyFlowRow[]> {
    try {
      return await this.smartMoneyService.getMoneyFlowsFromRedis(
        data.address,
        data.limit,
        data.offset,
      );
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chart/:token')
  async getChart(@Param('token') token: string): Promise<TokenChartsResponse> {
    try {
      return await this.smartMoneyService.getChartsByToken(token);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('top-pnl-accounts')
  async getTopPNLAccounts(): Promise<SmartMoneySummary[]> {
    try {
      return await this.smartMoneyService.getTopPNLAccounts();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
