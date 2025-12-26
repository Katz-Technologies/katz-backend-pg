import { ETagTotalPnl } from '../enum/tag-total-pnl.enum';

export const CTagPnlConfig: Record<ETagTotalPnl, number> = {
  VeryHighPnl: 100,
  HighPnl: 50,
  MidPnl: 10,
  LowPnl: 0,
  NegativePnl: -1,
};
