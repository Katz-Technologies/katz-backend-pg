import { ETagTotalVolume } from '../enum/tag-total-volume.enum';

export const CTagTotalVolumeConfig: Record<ETagTotalVolume, number> = {
  VeryHighTotalVolume: 10000,
  HighTotalVolume: 1000,
  MidTotalVolume: 100,
  LowTotalVolume: -1,
};
