import { DateTime } from 'luxon';

export interface VolumeData {
  volume: number;
  closeTime: DateTime;
  inLedgerIndex: number;
}
