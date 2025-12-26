import { AssetId } from './asset-id.type';
import { BalanceData } from './balance-data.type';

export interface BalancesData {
  [key: AssetId]: BalanceData[];
}
