import { Injectable } from '@nestjs/common';
import { ProcessedMoneyFlowRow } from 'src/service/smart_money/type/processed-money-flow-row.type';
import { SaleData } from 'src/service/smart_money/type/sale-data.type';
import { SaleVolumesData } from 'src/service/smart_money/type/sale-volumes-data.type';
import { AssetId } from 'src/service/smart_money/type/asset-id.type';
import { PurchaseData } from 'src/service/smart_money/type/purchase-data.type';
import { Deque } from '../../common/deque/deque.class';
import { ChainDomain } from '../chain/chain.domain';

@Injectable()
export class SalesDomain {
  constructor(private readonly chainDomain: ChainDomain) {}

  addPurchase(
    purchases: Map<string, Deque<PurchaseData>>,
    moneyFlow: ProcessedMoneyFlowRow,
  ): void {
    const key = `${moneyFlow.toAsset}`;
    const chainStep = this.chainDomain.createChainStep(moneyFlow);

    if (purchases.has(key)) {
      const targetDeque = purchases.get(key)!;
      targetDeque.pushFront({
        qty: moneyFlow.toAmount,
        fromAmount: moneyFlow.fromAmount,
        chain: [chainStep],
      });
    } else {
      purchases.set(key, new Deque<PurchaseData>());
      purchases.get(key)!.pushFront({
        qty: moneyFlow.toAmount,
        fromAmount: moneyFlow.fromAmount,
        chain: [chainStep],
      });
    }
  }

  manageNonXrpSwap(
    purchases: Map<string, Deque<PurchaseData>>,
    moneyFlow: ProcessedMoneyFlowRow,
  ): void {
    const swapChainStep = this.chainDomain.createChainStep(moneyFlow);
    let swapWritten = false;

    while (!swapWritten) {
      const purchaseList = purchases.get(moneyFlow.fromAsset);
      if (!purchaseList) break;

      const purchase = purchaseList.popBack();
      if (!purchase) break;

      const fromAmt = moneyFlow.fromAmount;
      const toAmt = moneyFlow.toAmount;

      let qty = 0;
      let isFromAmt = false;
      if (purchase.qty < fromAmt) {
        qty = purchase.qty;
      } else {
        isFromAmt = true;
        qty = fromAmt;
      }
      const cost = (purchase.fromAmount * qty) / purchase.qty;
      const proceeds = (toAmt * qty) / fromAmt;

      if (isFromAmt) {
        swapWritten = true;

        if (purchase.qty > fromAmt) {
          purchases.get(moneyFlow.fromAsset)!.pushBack({
            qty: purchase.qty - qty,
            fromAmount: purchase.fromAmount - cost,
            chain: purchase.chain,
          });
        }
      }

      const key = `${moneyFlow.toAsset}`;
      if (purchases.has(key)) {
        const targetDeque = purchases.get(key)!;
        targetDeque.pushFront({
          qty: proceeds,
          fromAmount: cost,
          chain: [...purchase.chain, swapChainStep],
        });
      } else {
        purchases.set(key, new Deque<PurchaseData>());
        purchases.get(key)!.pushFront({
          qty: proceeds,
          fromAmount: cost,
          chain: [...purchase.chain, swapChainStep],
        });
      }
    }
  }

  addSale(
    purchases: Map<string, Deque<PurchaseData>>,
    sales: SaleData[],
    moneyFlow: ProcessedMoneyFlowRow,
  ): void {
    const saleChainStep = this.chainDomain.createChainStep(moneyFlow);
    let positionClosed = false;

    while (!positionClosed) {
      const purchaseList = purchases.get(moneyFlow.fromAsset);
      if (!purchaseList) break;

      const purchase = purchaseList.popBack();
      if (!purchase) break;

      const fromAmt = moneyFlow.fromAmount;
      const toAmt = moneyFlow.toAmount;

      let qty = 0;
      let isFromAmt = false;
      if (purchase.qty < fromAmt) {
        qty = purchase.qty;
      } else {
        isFromAmt = true;
        qty = fromAmt;
      }

      const cost = (purchase.fromAmount * qty) / purchase.qty;
      const proceeds = (toAmt * qty) / fromAmt;

      if (isFromAmt) {
        positionClosed = true;

        if (purchase.qty > fromAmt) {
          purchaseList.pushBack({
            qty: purchase.qty - qty,
            fromAmount: purchase.fromAmount - cost,
            chain: purchase.chain,
          });
        }
      }

      if (proceeds > 0.000001) {
        const pnl = proceeds - cost;
        const fullChain = [...purchase.chain, saleChainStep];

        const chainWithProportions = this.chainDomain.buildChainTree(
          fullChain,
          qty,
          proceeds,
        );

        sales.push({
          qty: qty,
          fromAmount: cost,
          toAmount: proceeds,
          fromAmountUsd: cost * moneyFlow.xrpPrice,
          toAmountUsd: proceeds * moneyFlow.xrpPrice,
          pnl: pnl,
          pnlUsd: pnl * moneyFlow.xrpPrice,
          roi: pnl / cost,
          chain: chainWithProportions,
        });
      }
    }
  }

  getSalesByAsset(
    processedMoneyFlowRows: ProcessedMoneyFlowRow[],
    asset: AssetId,
  ): SaleData[] {
    const purchases: Map<string, Deque<PurchaseData>> = new Map();
    const sales: SaleData[] = [];

    for (const moneyFlow of processedMoneyFlowRows) {
      if (moneyFlow.fromAsset === asset && moneyFlow.toAsset !== asset) {
        this.addPurchase(purchases, moneyFlow);
      } else if (moneyFlow.toAsset === asset && moneyFlow.fromAsset !== asset) {
        this.addSale(purchases, sales, moneyFlow);
      } else {
        this.manageNonXrpSwap(purchases, moneyFlow);
      }
    }

    return sales;
  }

  getSaleVolumes(sales: SaleData[]): SaleVolumesData {
    const volumes: SaleVolumesData = {};

    for (const sale of sales) {
      if (!sale.chain || sale.chain.length === 0) continue;

      const firstStep = sale.chain[0];
      const lastStep = sale.chain[sale.chain.length - 1];

      const fromAmount = firstStep.proportionalFromAmount || 0;
      const toAmount = lastStep.proportionalToAmount || 0;

      const tokensInChain = new Set<AssetId>();
      for (const step of sale.chain) {
        tokensInChain.add(step.fromAsset);
        tokensInChain.add(step.toAsset);
      }

      for (const token of tokensInChain) {
        if (!volumes[token]) {
          volumes[token] = {
            fromVolume: 0,
            toVolume: 0,
            totalVolume: 0,
            pnl: 0,
          };
        }

        volumes[token].fromVolume += fromAmount;

        volumes[token].toVolume += toAmount;
      }
    }

    for (const token in volumes) {
      volumes[token].totalVolume =
        volumes[token].fromVolume + volumes[token].toVolume;
      volumes[token].pnl = volumes[token].toVolume - volumes[token].fromVolume;
    }

    const sortedEntries = Object.entries(volumes).sort(
      (a, b) => b[1].pnl - a[1].pnl,
    );
    const sortedVolumes: SaleVolumesData = {};
    for (const [token, data] of sortedEntries) {
      sortedVolumes[token] = data;
    }

    return sortedVolumes;
  }
}
