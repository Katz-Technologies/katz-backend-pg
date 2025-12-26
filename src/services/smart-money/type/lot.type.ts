export interface Lot {
  qty: number;
  costXRP: number;
  createdTx: string;
  createdSeq: number;
  originalXrpPurchaseTx?: string;
  xrpChain?: string[];
  sourceQty?: number;
}
