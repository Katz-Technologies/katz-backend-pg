export interface MoneyFlowRow {
  from_address: string;
  to_address: string;
  from_asset: string;
  to_asset: string;
  from_amount: string;
  to_amount: string;
  init_from_amount: string;
  init_to_amount: string;
  price_usd: string;
  kind: string;
  close_time: string;
  ledger_index: number;
  in_ledger_index: number;
  tx_hash: string;
}
