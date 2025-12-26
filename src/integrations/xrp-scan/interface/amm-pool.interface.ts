export interface ICurrency {
  currency: string;
  issuer?: string;
  value?: string;
}

export interface IAuctionSlot {
  Account?: string;
  account?: string;
  DiscountedFee?: number;
  discounted_fee?: number;
  Expiration?: number;
  expiration?: string;
  Price?: ICurrency;
  price?: ICurrency;
  time_interval?: number;
}

export interface IVoteEntry {
  Account?: string;
  account?: string;
  TradingFee?: number;
  trading_fee?: number;
  VoteWeight?: number;
  vote_weight?: number;
}

export interface IVoteSlot {
  VoteEntry?: IVoteEntry;
}

export interface IAmmPool {
  Account?: string;
  Asset: ICurrency;
  Asset2: ICurrency;
  AuctionSlot?: IAuctionSlot;
  Flags?: number;
  LPTokenBalance?: ICurrency;
  OwnerNode?: string;
  TradingFee?: number;
  VoteSlots?: IVoteSlot[];
  index?: string;
  Balance?: number;
}
