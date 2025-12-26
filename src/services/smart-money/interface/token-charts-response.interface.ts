import { VolumeChartPoint } from '../type/token-summary.type';

export interface TokenChartsResponse {
  volume: {
    oneHour: VolumeChartPoint[] | null;
    oneDay: VolumeChartPoint[] | null;
    sevenDay: VolumeChartPoint[] | null;
    thirtyDay: VolumeChartPoint[] | null;
  };
  holders: {
    oneHour: VolumeChartPoint[] | null;
    oneDay: VolumeChartPoint[] | null;
    sevenDay: VolumeChartPoint[] | null;
    thirtyDay: VolumeChartPoint[] | null;
  };
  traders: {
    oneHour: VolumeChartPoint[] | null;
    oneDay: VolumeChartPoint[] | null;
    sevenDay: VolumeChartPoint[] | null;
    thirtyDay: VolumeChartPoint[] | null;
  };
}
