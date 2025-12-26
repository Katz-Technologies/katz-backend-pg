import { DateTime } from 'luxon';
import { AssetId } from './asset-id.type';

export interface ChainStep {
  hash: string;
  txCloseTime: DateTime;
  fromAsset: AssetId;
  toAsset: AssetId;
  fromAmount: number;
  toAmount: number;
  proportionalFromAmount?: number;
  proportionalToAmount?: number;
}
