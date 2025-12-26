import { IssuedCurrency } from 'xrpl';

export interface IGetOhlcv {
  asset: IssuedCurrency;
  period: OhlcvPeriod;
  limit: number;
  beforeTimestamp?: string;
}

export type OhlcvPeriod =
  | '1_minute'
  | '5_minute'
  | '15_minute'
  | '1_hour'
  | '4_hour'
  | '12_hour'
  | '1_day';
