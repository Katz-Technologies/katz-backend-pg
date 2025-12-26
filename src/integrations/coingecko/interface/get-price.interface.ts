import { ECurrency } from '../enum/currency.enum';

export interface IGetPrice {
  ids: string | string[];
  vs_currencies: ECurrency[];
  include_market_cap?: boolean;
  include_24hr_vol?: boolean;
  include_24hr_change?: boolean;
  include_last_updated_at?: boolean;
  precision?: 'full' | number;
}
