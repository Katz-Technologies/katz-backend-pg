import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SologenicService } from 'src/integrations/sologenic/sologenic.service';
import { GetOhlcDto } from './dto/get-ohlc.dto';
import { GetTickersDto } from './dto/get-tickers.dto';
import { GetTradesDto } from './dto/get-trades.dto';
import { IssuedCurrency, XRP } from 'xrpl';
import { IOhlcResponse } from 'src/integrations/sologenic/interface/ohlc-response.interface';
import { ITickersResponse } from 'src/integrations/sologenic/interface/tickers-response.interface';
import { ITradesResponse } from 'src/integrations/sologenic/interface/trades-response.interface';

@Controller('v1/sologenic')
export class SologenicController {
  constructor(private readonly sologenicService: SologenicService) {}

  @Get('ohlc')
  async getOhlc(@Query() params: GetOhlcDto): Promise<IOhlcResponse> {
    const asset: IssuedCurrency | XRP =
      params.assetCurrency === 'XRP'
        ? { currency: 'XRP' }
        : {
            currency: params.assetCurrency,
            issuer: params.assetIssuer!,
          };

    const asset2: IssuedCurrency | XRP =
      params.asset2Currency === 'XRP'
        ? { currency: 'XRP' }
        : {
            currency: params.asset2Currency,
            issuer: params.asset2Issuer!,
          };

    return this.sologenicService.getOhlc({
      asset,
      asset2,
      period: params.period,
      from: params.from,
      to: params.to,
    });
  }

  @Post('tickers/24h')
  async getTickers24h(@Body() data: GetTickersDto): Promise<ITickersResponse> {
    const symbols = data.symbols.map((v) => {
      const asset: IssuedCurrency | XRP =
        v.assetCurrency === 'XRP'
          ? { currency: 'XRP' }
          : {
              currency: v.assetCurrency,
              issuer: v.assetIssuer!,
            };

      const asset2: IssuedCurrency | XRP =
        v.asset2Currency === 'XRP'
          ? { currency: 'XRP' }
          : {
              currency: v.asset2Currency,
              issuer: v.asset2Issuer!,
            };

      return { asset, asset2 };
    });

    return this.sologenicService.getTickers24h({ symbols });
  }

  @Get('trades')
  async getTrades(@Query() params: GetTradesDto): Promise<ITradesResponse> {
    let asset: IssuedCurrency | XRP | undefined;
    let asset2: IssuedCurrency | XRP | undefined;

    if (params.assetCurrency) {
      asset =
        params.assetCurrency === 'XRP'
          ? { currency: 'XRP' }
          : {
              currency: params.assetCurrency,
              issuer: params.assetIssuer!,
            };
    }

    if (params.asset2Currency) {
      asset2 =
        params.asset2Currency === 'XRP'
          ? { currency: 'XRP' }
          : {
              currency: params.asset2Currency,
              issuer: params.asset2Issuer!,
            };
    }

    return this.sologenicService.getTrades({
      asset,
      asset2,
      account: params.account,
      limit: params.limit,
      beforeId: params.beforeId,
      afterId: params.afterId,
    });
  }
}
