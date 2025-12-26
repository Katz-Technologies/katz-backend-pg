import {
  Controller,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { AnalyzeAccountDto } from './dto/req-analyze-account.dto';
import { SmartMoneyService } from '../../../service/smart_money/smart-money.service';
import { ReqTokenHistoryDto } from './dto/req-token-history.dto';
import { NewTokenService } from 'src/service/new-token/new-token.service';

@Controller('v1/smart-money')
export class SmartMoneyController {
  constructor(
    private readonly smartMoneyService: SmartMoneyService,
    private readonly newTokenService: NewTokenService,
  ) {}

  @Get('sales')
  async getSales(@Query() data: AnalyzeAccountDto) {
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
  async getTokenHistory(@Query() data: ReqTokenHistoryDto) {
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
  async getTokenSummary(@Param('asset') asset: string) {
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
  async getNewTokens() {
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
  async getAllTokens() {
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
  async getTopVolumeTokens() {
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
  async getMoneyFlows(@Query() data: AnalyzeAccountDto) {
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
  async getChart(@Param('token') token: string) {
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
  async getTopPNLAccounts() {
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
