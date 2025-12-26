import { AssetId } from './asset-id.type';
import { Lot } from './lot.type';

export type PositionBook = Record<AssetId, Lot[]>;
