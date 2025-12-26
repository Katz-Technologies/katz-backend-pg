import { IssuedCurrency, XRP } from 'xrpl';

export interface IGetTrades {
  asset?: IssuedCurrency | XRP;
  asset2?: IssuedCurrency | XRP;
  account?: string;
  limit?: number;
  beforeId?: number;
  afterId?: number;
}

//Обязательно либо asset + asset2, либо account
