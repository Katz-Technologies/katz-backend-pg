export enum AssetClass {
  fiat = 'fiat',
  commodity = 'commodity',
  equity = 'equity',
  cryptocurrency = 'cryptocurrency',
}

export interface ITokenMeta {
  name?: string;
  description?: string;
  icon?: string;
  trust_level?: number;
  asset_class?: AssetClass;
  weblinks?: string[];
}

export interface IIssuerMeta {
  name?: string;
  description?: string;
  icon?: string;
  kyc?: boolean;
  trust_level?: number;
  weblinks?: string[];
}

export interface IMeta {
  token?: ITokenMeta;
  issuer?: IIssuerMeta;
}

export interface IMetrics {
  trustlines: number;
  holders: number;
  supply: string;
  marketcap: string;
  price: string;
  volume_24h: string;
  volume_7d: string;
  exchanges_24h: number;
  exchanges_7d: number;
  takers_24h: number;
  takers_7d: number;
}

export interface IMetricChange {
  delta?: number | string;
  percent?: number;
}

export interface IChanges24h {
  trustlines?: IMetricChange;
  holders?: IMetricChange;
  supply?: IMetricChange;
  marketcap?: IMetricChange;
  price?: IMetricChange;
}

export interface IChanges7d {
  trustlines?: IMetricChange;
  holders?: IMetricChange;
  supply?: IMetricChange;
  marketcap?: IMetricChange;
  price?: IMetricChange;
}

export interface IChanges {
  '24h'?: IChanges24h;
  '7d'?: IChanges7d;
}

export interface IToken {
  currency: string;
  issuer: string;
  meta?: IMeta;
  metrics: IMetrics;
  changes?: IChanges;
  richList?: IRichListItem[];
}

export interface IGetTokensResponse {
  tokens: IToken[];
  count: number;
}

export interface IRichListItem {
  address: string;
  balance: number;
}
