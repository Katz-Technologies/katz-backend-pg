export interface ITickerData {
  open_time: number;
  open_price: string;
  high_price: string;
  low_price: string;
  last_price: string;
  volume: string;
}

export interface ITickersResponse {
  [symbol: string]: ITickerData;
}
