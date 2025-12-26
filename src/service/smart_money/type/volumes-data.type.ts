import { AssetId } from './asset-id.type';
import { VolumeData } from './volume-data.type';

export interface VolumesData {
  [key: AssetId]: VolumeData[];
}
