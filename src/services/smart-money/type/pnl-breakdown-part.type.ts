import { ChainStep } from './chain-step.type';

export interface PnLBreakdownPart {
  sourceTx: string;
  qtySold: number;
  costXRP: number;
  proceedsXRP: number;
  pnlXRP: number;
  costUSD: number;
  proceedsUSD: number;
  pnlUSD: number;
  xrpChain: string[];
  chainSteps: ChainStep[];
}
