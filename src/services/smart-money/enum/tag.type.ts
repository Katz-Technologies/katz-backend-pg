import { ETagOtherMetrics } from './tag-other-metrics.enum';
import { ETagTraderType } from './tag-trader-type.enum';
import { ETagWinrate } from './tag-winrate.enum';
import { ETagTotalPnl } from './tag-total-pnl.enum';
import { ETagTotalVolume } from './tag-total-volume.enum';
import { ETagAvgRoi } from './tag-avg-roi.enum';
import { ETagGroupVolume } from './tag-group-volume.enum';

export type ETag =
  | ETagOtherMetrics
  | ETagTraderType
  | ETagWinrate
  | ETagTotalPnl
  | ETagTotalVolume
  | ETagAvgRoi
  | ETagGroupVolume;
