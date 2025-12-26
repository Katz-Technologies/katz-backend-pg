import { IssuedCurrency } from 'xrpl';
import { IGetOhlcv } from './interface/get-ohlcv.interface';
import { OhlcvDataPoint } from './interface/ohlcv-data-point.type';
import { GeckoTerminalResponse } from './interface/gecko-terminal-response.interface';
import * as lodash from 'lodash';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeckoTerminalService {
  private getOhlcv(data: IGetOhlcv): Promise<OhlcvDataPoint[]> {
    return fetch(
      `https://api.geckoterminal.com/api/v2/networks/xrpl/pools/${
        data.asset.currency
      }.${data.asset.issuer}_XRP/ohlcv/${data.period.split('_')[1]}?aggregate=${
        data.period.split('_')[0]
      }&limit=${data.limit}&currency=token&include_empty_intervals=true${
        data.beforeTimestamp ? '&before_timestamp=' + data.beforeTimestamp : ''
      }`,
    ).then((v) =>
      v
        .json()
        .then(
          (response: GeckoTerminalResponse) =>
            response.data.attributes.ohlcv_list,
        ),
    );
  }

  async getLast24hVolume(asset: IssuedCurrency): Promise<number> {
    const first = await this.getOhlcv({
      asset: asset,
      limit: 1000,
      period: '1_minute',
    });

    if (!first || first.length === 0) {
      return 0;
    }

    const lastItem = first[first.length - 1];
    if (!lastItem) {
      return lodash.concat(first, []).reduce((amount: number, v: number[]) => {
        return (amount += v[v.length - 1] || 0);
      }, 0);
    }

    const second = await this.getOhlcv({
      asset: asset,
      limit: 440,
      period: '1_minute',
      beforeTimestamp: String(lastItem[0]),
    });

    return lodash
      .concat(first, second)
      .reduce((amount: number, v: number[]) => {
        return (amount += v[v.length - 1] || 0);
      }, 0);
  }
}
