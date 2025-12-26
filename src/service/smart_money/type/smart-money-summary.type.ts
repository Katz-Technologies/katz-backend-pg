import { ETag } from '../enum/tag.type';
import { BalancesData } from './balances-data.type';
import { SaleData } from './sale-data.type';
import { SaleVolumesData } from './sale-volumes-data.type';
import { VolumesData } from './volumes-data.type';

export interface SmartMoneySummary {
  address: string;
  totalPnl: number;
  totalPnlUsd: number;
  avgPnl: number;
  avgPnlUsd: number;
  avgBuy: number;
  avgBuyUsd: number;
  avgSale: number;
  avgSaleUsd: number;
  avgRoi: number;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
  winrate: number;
  buyVolume: number;
  buyVolumeUsd: number;
  saleVolume: number;
  saleVolumeUsd: number;
  totalVolume: number;
  totalVolumeUsd: number;
  sales: SaleData[];
  minPNL: SaleData;
  maxPNL: SaleData;
  tags: ETag[];
  balances: BalancesData;
  volumes: VolumesData;
  saleVolumes: SaleVolumesData;
}
