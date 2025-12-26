import { IssuedCurrency, XRP } from 'xrpl';
import { IGetOhlc } from './interface/get-ohlc.interface';
import { IGetTickers } from './interface/get-tickers.interface';
import { IGetTrades } from './interface/get-trades.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SologenicService {
  async getOhlc(params: IGetOhlc) {
    const query = new URLSearchParams();

    const symbol = this.buildSymbol(params.asset, params.asset2);
    query.set('symbol', symbol);

    if (params.period) query.set('period', params.period);
    if (typeof params.from === 'number') query.set('from', String(params.from));
    if (typeof params.to === 'number') query.set('to', String(params.to));

    const res = await fetch(
      `https://api.sologenic.org/api/v1/ohlc?${query.toString()}`,
    );
    return res.json();
  }

  async getTickers24h(data: IGetTickers) {
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
    return res.json();
  }

  async getTrades(params: IGetTrades) {
    if (!params.asset && !params.asset2 && !params.account)
      throw new Error(
        'Required params.asset && params.asset2 || params.account',
      );

    const query = new URLSearchParams();

    if (params.asset && params.asset2) {
      const symbol = this.buildSymbol(params.asset, params.asset2);
      query.set('symbol', symbol);
    } else {
      query.set('account', params.account!);
    }

    if (params.limit) query.set('limit', String(params.limit));
    if (params.afterId) query.set('after_id', String(params.afterId));
    if (params.beforeId) query.set('before_id', String(params.beforeId));

    const res = await fetch(
      `https://api.sologenic.org/api/v1/trades?${query.toString()}`,
    );
    return res.json();
  }

  private buildSymbol(
    asset: IssuedCurrency | XRP,
    asset2: IssuedCurrency | XRP,
  ) {
    const assetFormatted =
      asset.currency === 'XRP' ? 'XRP' : `${asset.currency}+${asset.issuer}`;
    const asset2Formatted =
      asset2.currency === 'XRP' ? 'XRP' : `${asset2.currency}+${asset2.issuer}`;

    return `${assetFormatted}/${asset2Formatted}`;
  }
}
