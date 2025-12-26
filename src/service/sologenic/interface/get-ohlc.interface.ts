import { IssuedCurrency, XRP } from 'xrpl';

export interface IGetOhlc {
  asset: IssuedCurrency | XRP;
  asset2: IssuedCurrency | XRP;
  period: OHLCPeriod;
  from: number;
  to: number;
}

export type OHLCPeriod =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '3h'
  | '6h'
  | '12h'
  | '1d'
  | '3d'
  | '1w';
