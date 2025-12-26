import { ChainStep } from './chain-step.type';

export interface SaleData {
  qty: number;
  fromAmount: number;
  toAmount: number;
  fromAmountUsd: number;
  toAmountUsd: number;
  pnl: number;
  pnlUsd: number;
  roi: number;
  chain: ChainStep[];
}
