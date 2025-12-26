import { TokenSummary } from './token-summary.type';

export interface TopTokenData extends TokenSummary {
  top: number;
  token: string;
}
