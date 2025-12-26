export interface IGetNftVolumesExtended {
  list: 'collections';
  convertCurrencies?: string;
  sortCurrency?: string;
  floorPrice?: boolean;
  statistics?: boolean;
  period?: string;
  saleType?: string;
}
