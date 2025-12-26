import { IssuedCurrency } from 'xrpl';
import { IGetOhlcv } from './interface/get-ohlcv.interface';
import * as lodash from 'lodash';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeckoTerminalService {
  private getOhlcv(data: IGetOhlcv) {
    return fetch(
      `https://api.geckoterminal.com/api/v2/networks/xrpl/pools/${
        data.asset.currency
      }.${data.asset.issuer}_XRP/ohlcv/${data.period.split('_')[1]}?aggregate=${
        data.period.split('_')[0]
      }&limit=${data.limit}&currency=token&include_empty_intervals=true${
        data.beforeTimestamp ? '&before_timestamp=' + data.beforeTimestamp : ''
      }`,
    ).then((v) => v.json().then((v) => v.data.attributes.ohlcv_list));
  }

  async getLast24hVolume(asset: IssuedCurrency) {
    const first = await this.getOhlcv({
      asset: asset,
      limit: 1000,
      period: '1_minute',
    });

    const second = await this.getOhlcv({
      asset: asset,
      limit: 440,
      period: '1_minute',
      beforeTimestamp: first[first.length - 1][0],
    });

    return lodash
      .concat(first, second)
      .reduce((amount: number, v: number[]) => {
        return (amount += v[v.length - 1]);
      }, 0);
  }
}
