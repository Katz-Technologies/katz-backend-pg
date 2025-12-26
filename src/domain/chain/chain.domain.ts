import { Injectable } from '@nestjs/common';
import { ProcessedMoneyFlowRow } from 'src/services/smart-money/type/processed-money-flow-row.type';
import { ChainStep } from 'src/services/smart-money/type/chain-step.type';

@Injectable()
export class ChainDomain {
  createChainStep(moneyFlow: ProcessedMoneyFlowRow): ChainStep {
    return {
      hash: moneyFlow.hash,
      txCloseTime: moneyFlow.closeTime,
      fromAsset: moneyFlow.fromAsset,
      toAsset: moneyFlow.toAsset,
      fromAmount: Math.abs(moneyFlow.fromAmount),
      toAmount: moneyFlow.toAmount,
    };
  }

  buildChainTree(
    chain: ChainStep[],
    finalSoldQty: number,
    finalProceedsXRP: number,
  ): ChainStep[] {
    const steps = chain.map((step) => ({ ...step }));

    let currentQty = finalSoldQty;

    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (!step) continue;

      if (i === steps.length - 1) {
        step.proportionalFromAmount = currentQty;
        step.proportionalToAmount = finalProceedsXRP;
      } else {
        const proportion = currentQty / step.toAmount;
        step.proportionalFromAmount = step.fromAmount * proportion;
        step.proportionalToAmount = currentQty;
        currentQty = step.proportionalFromAmount;
      }
    }

    return steps;
  }
}
