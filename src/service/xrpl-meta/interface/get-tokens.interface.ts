import { ETokensSort } from '../enum/tokens-sort.enum';

export interface IGetTokens {
  name_like?: string;
  expand_meta?: boolean; //default false
  include_changes?: boolean; //default false
  sort_by?: ETokensSort; //default "trustlines"
  trust_level?: number[]; //default [0,1,2,3]
  limit?: number; //default 100
  offset?: number; //default 0
}
