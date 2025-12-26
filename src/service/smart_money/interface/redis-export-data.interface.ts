import { MoneyFlowRow } from './money-flow-row.interface';

export interface RedisExportData {
  [key: string]: MoneyFlowRow[];
}
