import { DateTime } from 'luxon';
import { Kind } from './kind.type';
import { AssetId } from './asset-id.type';

export interface ProcessedMoneyFlowRow {
  hash: string;
  fromAddress: string;
  toAddress: string;
  fromAsset: AssetId;
  toAsset: AssetId;
  fromAmount: number;
  toAmount: number;
  initFromAmount: number;
  initToAmount: number;
  kind: Kind;
  xrpPrice: number;
  closeTime: DateTime;
  ledgerIndex: number;
  inLedgerIndex: number;
}
