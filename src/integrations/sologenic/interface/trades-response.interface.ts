export interface ITrade {
  id: number;
  txid: string;
  symbol: string;
  buyer: string;
  seller: string;
  is_seller_taker: boolean;
  amount: string;
  price: string;
  quote_amount: string;
  executed_at: string;
  time: string;
}

export type ITradesResponse = ITrade[];
