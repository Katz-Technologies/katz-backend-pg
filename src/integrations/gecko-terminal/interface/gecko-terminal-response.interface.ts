import { OhlcvDataPoint } from './ohlcv-data-point.type';

export interface GeckoTerminalResponse {
  data: {
    attributes: {
      ohlcv_list: OhlcvDataPoint[];
    };
  };
}
