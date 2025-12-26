import { ETagTraderType } from '../enum/tag-trader-type.enum';
import { ETagTotalPnl } from '../enum/tag-total-pnl.enum';
import { ETagTotalVolume } from '../enum/tag-total-volume.enum';

export const ExcludedTags = [
  ETagTraderType.Bot,
  ETagTotalPnl.NegativePnl,
  ETagTotalVolume.LowTotalVolume,
];
