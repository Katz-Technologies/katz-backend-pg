import { IssuedCurrency, XRP } from 'xrpl';

export interface IGetTickers {
  symbols: { asset: IssuedCurrency | XRP; asset2: IssuedCurrency | XRP }[];
}
