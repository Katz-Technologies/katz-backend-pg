import { IWebLink } from '../../xrpl-meta/interface/get-tokens-response.interface';

export interface ITokenMeta {
  description?: string;
  icon?: string;
  name?: string;
  trust_level?: number;
  weblinks?: IWebLink[];
}

export interface IIssuerMeta {
  description?: string;
  icon?: string;
  kyc?: boolean;
  name?: string;
  trust_level?: number;
  weblinks?: IWebLink[];
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

export interface ITomlData {
  METADATA?: {
    modified: string;
  };
  ORGANIZATION?: {
    name?: string;
    website?: string;
    twitter?: string;
  };
  PRINCIPALS?: Array<{
    name?: string;
    email?: string;
  }>;
  VALIDATORS?: Array<{
    public_key: string;
    attestation?: string;
    owner_country?: string;
    server_country?: string;
    network?: string;
    unl?: string;
  }>;
  SERVERS?: Array<{
    peer?: string;
    ws?: string;
    rpc?: string;
    network?: string;
    port?: number;
  }>;
  ACCOUNTS?: Array<{
    address: string;
    desc?: string;
  }>;
  ISSUERS?: Array<{
    address: string;
    name?: string;
  }>;
  TOKENS?: Array<{
    issuer: string;
    currency: string;
    name?: string;
    desc?: string;
    icon?: string;
    WEBLINKS?: IWebLink[];
  }>;
  [key: string]: unknown;
}

export interface IIssuingAccount {
  name?: string;
  desc?: string;
  account: string;
  domain?: string;
  twitter?: string;
  verified?: boolean;
}

export interface ITokenInfo {
  id: string;
  amms: number;
  code: string;
  createdAt: string;
  currency: string;
  holders: number;
  issuer: string;
  token: string;
  updatedAt: string;
  blackholed: boolean;
  marketcap: number;
  price: number;
  supply: number;
  meta?: IMeta;
  metrics: IMetrics;
  tomldata?: ITomlData;
  disabled: boolean;
  score: number;
  IssuingAccount?: IIssuingAccount;
}
