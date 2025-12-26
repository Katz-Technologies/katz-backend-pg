import { ICurrency } from './amm-pool.interface';

export interface IVoteSlot {
  account: string;
  trading_fee: number;
  vote_weight: number;
}

export interface IAuctionSlot {
  account: string;
  discounted_fee: number;
  expiration: string;
  price: ICurrency;
  time_interval: number;
}

export interface IAmmInfo {
  account: string;
  amount: string;
  amount2: ICurrency;
  asset2_frozen: boolean;
  auction_slot?: IAuctionSlot;
  lp_token: ICurrency;
  trading_fee: number;
  vote_slots: IVoteSlot[];
}
