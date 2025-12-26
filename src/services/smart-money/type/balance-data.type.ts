import { DateTime } from 'luxon';

export interface BalanceData {
  balance: number;
  closeTime: DateTime;
  inLedgerIndex: number;
}
