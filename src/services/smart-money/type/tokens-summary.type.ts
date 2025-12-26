import { AssetId } from './asset-id.type';
import { TokenSummary } from './token-summary.type';

export interface TokensSummary {
  [token: AssetId]: TokenSummary;
}
