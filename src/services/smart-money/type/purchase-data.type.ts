import { ChainStep } from './chain-step.type';

export interface PurchaseData {
  qty: number;
  fromAmount: number;
  chain: ChainStep[];
}
