import { IssuedCurrency, XRP } from 'xrpl';
import { RatesInCurrency } from 'xrpl-orderbook-reader';

export interface IGetOrderbook {
  trade: {
    from: IssuedCurrency | XRP;
    to: IssuedCurrency | XRP;
    amount: number;
  };
  options: Partial<{
    rates: RatesInCurrency;
    timeoutSeconds: number;
    maxSpreadPercentage: number;
    maxSlippagePercentage: number;
    maxSlippagePercentageReverse: number;
    maxBookLines: number;
    includeBookData: boolean;
    verboseBookData: boolean;
  }>;
}
