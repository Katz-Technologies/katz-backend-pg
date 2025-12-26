import { IssuedCurrency, XRP } from 'xrpl';
import { IGetOhlc } from './interface/get-ohlc.interface';
import { IGetTickers } from './interface/get-tickers.interface';
import { IGetTrades } from './interface/get-trades.interface';
import { IOhlcResponse } from './interface/ohlc-response.interface';
import { ITickersResponse } from './interface/tickers-response.interface';
import { ITradesResponse } from './interface/trades-response.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SologenicService {
  async getOhlc(params: IGetOhlc): Promise<IOhlcResponse> {
    const query = new URLSearchParams();

    const symbol = this.buildSymbol(params.asset, params.asset2);
    query.set('symbol', encodeURIComponent(symbol));

    query.set('period', params.period);
    query.set('from', String(params.from));
    query.set('to', String(params.to));

    const res = await fetch(
      `https://api.sologenic.org/api/v1/ohlc?${query.toString()}`,
    );
    return res.json() as Promise<IOhlcResponse>;
  }

  async getTickers24h(data: IGetTickers): Promise<ITickersResponse> {
    const body = {
      symbols: data.symbols.map((v) => this.buildSymbol(v.asset, v.asset2)),
    };

    const res = await fetch('https://api.sologenic.org/api/v1/tickers/24h', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<ITickersResponse>;
  }

  async getTrades(params: IGetTrades): Promise<ITradesResponse> {
    const hasSymbol = params.asset && params.asset2;
    const hasAccount = !!params.account;

    if (!hasSymbol && !hasAccount) {
      throw new Error(
        'Required params.asset && params.asset2 || params.account',
      );
    }

    const query = new URLSearchParams();

    if (params.asset && params.asset2) {
      const symbol = this.buildSymbol(params.asset, params.asset2);
      query.set('symbol', encodeURIComponent(symbol));
    } else {
      query.set('account', params.account!);
    }

    if (params.limit) query.set('limit', String(params.limit));
    if (params.afterId) query.set('after_id', String(params.afterId));
    if (params.beforeId) query.set('before_id', String(params.beforeId));

    const res = await fetch(
      `https://api.sologenic.org/api/v1/trades?${query.toString()}`,
    );
    return res.json() as Promise<ITradesResponse>;
  }

  private buildSymbol(
    asset: IssuedCurrency | XRP,
    asset2: IssuedCurrency | XRP,
  ): string {
    const assetFormatted =
      asset.currency === 'XRP' ? 'XRP' : `${asset.currency}+${asset.issuer}`;
    const asset2Formatted =
      asset2.currency === 'XRP' ? 'XRP' : `${asset2.currency}+${asset2.issuer}`;

    return `${assetFormatted}/${asset2Formatted}`;
  }
}
