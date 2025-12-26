import { Injectable } from '@nestjs/common';
import { IGetPrice } from './interface/get-price.interface';

@Injectable()
export class CoingeckoService {
  getPrice(data: IGetPrice) {
    const vsCurrencies = data.vs_currencies.join(',');
    return fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=${vsCurrencies}`,
    ).then((r) => r.json());
  }
}
