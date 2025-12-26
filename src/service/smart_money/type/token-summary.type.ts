import { ETag } from '../enum/tag.type';

export interface VolumeChartPoint {
  timestamp: number;
  value: number;
}

export interface TokenVolumeCharts {
  hour: VolumeChartPoint[];
  day: VolumeChartPoint[];
  week: VolumeChartPoint[];
  month: VolumeChartPoint[];
}

export interface TokenSummary {
  holders: {
    address: string;
    balance: number;
    volume: number;
    tags: ETag[];
  }[];
  traders: number;
  sellers: number;
  buyers: number;
  exchanges: number;
  avgBalance: number;
  volume: {
    buyVolume: number;
    saleVolume: number;
    totalVolume: number;
  };
  avgVolume: number;
  richList: {
    address: string;
    balance: number;
  }[];
  volumeRichList: {
    address: string;
    volume: number;
  }[];
}
