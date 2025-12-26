import { AssetId } from './asset-id.type';
import { SaleVolumeData } from './sale-volume-data.type';

export interface SaleVolumesData {
  [key: AssetId]: SaleVolumeData;
}
