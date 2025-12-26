import { AssetId } from './asset-id.type';
import { PnLBreakdownPart } from './pnl-breakdown-part.type';

export interface PnLEntry {
  txId: string;
  assetSold: AssetId;
  qtySold: number;
  proceedsXRP: number;
  releasedCostXRP: number;
  realizedPnL: number;
  proceedsUSD: number;
  releasedCostUSD: number;
  realizedPnLUSD: number;
  roi: number;
  breakdown: PnLBreakdownPart[];
}
