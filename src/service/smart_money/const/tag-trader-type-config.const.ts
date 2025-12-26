import { ETagTraderType } from '../enum/tag-trader-type.enum';

export const CTagTraderTypeConfig: Record<ETagTraderType, number> = {
  Bot: 200,
  ActiveTrader: 50,
  BacisTrader: 10,
  PassiveTrader: -1,
};
