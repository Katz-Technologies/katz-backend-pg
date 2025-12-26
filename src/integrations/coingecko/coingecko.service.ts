import { Injectable } from '@nestjs/common';
import { IGetPrice } from './interface/get-price.interface';
import { IPriceResponse } from './interface/price-response.interface';

@Injectable()
export class CoingeckoService {
  getPrice(data: IGetPrice): Promise<IPriceResponse> {
    const queryParams = new URLSearchParams();

    if (Array.isArray(data.ids)) {
      queryParams.append('ids', data.ids.join(','));
    } else {
      queryParams.append('ids', data.ids);
    }

    queryParams.append('vs_currencies', data.vs_currencies.join(','));

    if (data.include_market_cap !== undefined) {
      queryParams.append('include_market_cap', String(data.include_market_cap));
    }
    if (data.include_24hr_vol !== undefined) {
      queryParams.append('include_24hr_vol', String(data.include_24hr_vol));
    }
    if (data.include_24hr_change !== undefined) {
      queryParams.append(
        'include_24hr_change',
        String(data.include_24hr_change),
      );
    }
    if (data.include_last_updated_at !== undefined) {
      queryParams.append(
        'include_last_updated_at',
        String(data.include_last_updated_at),
      );
    }
    if (data.precision !== undefined) {
      queryParams.append(
        'precision',
        data.precision === 'full' ? 'full' : String(data.precision),
      );
    }

    const queryString = queryParams.toString();
    const url = `https://api.coingecko.com/api/v3/simple/price${
      queryString ? '?' + queryString : ''
    }`;

    return fetch(url).then((r) => r.json() as Promise<IPriceResponse>);
  }
}
