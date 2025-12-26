import { ETopType } from '../enum/top-types.enum';
import { ETokensSort } from '../../xrpl-meta/enum/tokens-sort.enum';

export const TOP_TYPE_TO_SORT_MAP: Record<ETopType, ETokensSort> = {
  [ETopType.TRENDING]: ETokensSort.takers_24h,
  [ETopType.TRUSTLINES]: ETokensSort.trustlines,
  [ETopType.TRUSTLINES_DELTA_24H]: ETokensSort.trustlines_delta_24h,
  [ETopType.TRUSTLINES_DELTA_7D]: ETokensSort.trustlines_delta_7d,
  [ETopType.HOLDERS]: ETokensSort.holders,
  [ETopType.HOLDERS_DELTA_24H]: ETokensSort.holders_delta_24h,
  [ETopType.HOLDERS_DELTA_7D]: ETokensSort.holders_delta_7d,
  [ETopType.MARKETCAP]: ETokensSort.marketcap,
  [ETopType.MARKETCAP_DELTA_24H]: ETokensSort.marketcap_delta_24h,
  [ETopType.MARKETCAP_DELTA_7D]: ETokensSort.marketcap_delta_7d,
  [ETopType.PRICE_CHANGE_24H]: ETokensSort.price_percent_24h,
  [ETopType.PRICE_CHANGE_7D]: ETokensSort.price_percent_7d,
  [ETopType.VOLUME_24H]: ETokensSort.volume_24h,
  [ETopType.VOLUME_7D]: ETokensSort.volume_7d,
  [ETopType.TRADERS_24H]: ETokensSort.exchanges_24h,
  [ETopType.TRADERS_7D]: ETokensSort.exchanges_7d,
};

export const ALL_TOP_TYPES = Object.values(ETopType);
