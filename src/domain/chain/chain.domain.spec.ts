import { Test, TestingModule } from '@nestjs/testing';
import { ChainDomain } from './chain.domain';
import { ProcessedMoneyFlowRow } from 'src/services/smart-money/type/processed-money-flow-row.type';
import { ChainStep } from 'src/services/smart-money/type/chain-step.type';
import { DateTime } from 'luxon';

// eslint-disable-next-line max-lines-per-function
describe('ChainDomain', () => {
  let service: ChainDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChainDomain],
    }).compile();

    service = module.get<ChainDomain>(ChainDomain);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChainStep', () => {
    it('should create chain step from money flow', () => {
      const closeTime = DateTime.now();
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 100,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.createChainStep(moneyFlow);

      expect(result).toEqual({
        hash: 'test-hash',
        txCloseTime: closeTime,
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: 100, // Math.abs(-100)
        toAmount: 50,
      });
    });

    it('should handle positive fromAmount', () => {
      const closeTime = DateTime.now();
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: 100,
        toAmount: 50,
        initFromAmount: 100,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.createChainStep(moneyFlow);

      expect(result.fromAmount).toBe(100);
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe('buildChainTree', () => {
    it('should build chain tree with proportions for single step', () => {
      const closeTime = DateTime.now();
      const chain: ChainStep[] = [
        {
          hash: 'hash1',
          txCloseTime: closeTime,
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: 100,
          toAmount: 50,
        },
      ];

      const result = service.buildChainTree(chain, 30, 15);

      expect(result).toHaveLength(1);
      expect(result[0]?.proportionalFromAmount).toBe(30);
      expect(result[0]?.proportionalToAmount).toBe(15);
    });

    it('should build chain tree with proportions for multiple steps', () => {
      const closeTime = DateTime.now();
      const chain: ChainStep[] = [
        {
          hash: 'hash1',
          txCloseTime: closeTime,
          fromAsset: 'EUR.rIssuer',
          toAsset: 'USD.rIssuer',
          fromAmount: 200,
          toAmount: 150,
        },
        {
          hash: 'hash2',
          txCloseTime: closeTime,
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: 150,
          toAmount: 100,
        },
      ];

      const result = service.buildChainTree(chain, 50, 30);

      expect(result).toHaveLength(2);

      // Last step (hash2)
      expect(result[1]?.proportionalFromAmount).toBe(50);
      expect(result[1]?.proportionalToAmount).toBe(30);

      // First step (hash1) - пропорция рассчитывается от последнего шага
      const proportion = 50 / 150; // currentQty / step.toAmount
      expect(result[0]?.proportionalFromAmount).toBeCloseTo(200 * proportion);
      expect(result[0]?.proportionalToAmount).toBe(50);
    });

    it('should handle empty chain', () => {
      const result = service.buildChainTree([], 10, 5);

      expect(result).toHaveLength(0);
    });

    it('should calculate correct proportions for complex chain', () => {
      const closeTime = DateTime.now();
      const chain: ChainStep[] = [
        {
          hash: 'hash1',
          txCloseTime: closeTime,
          fromAsset: 'TOKEN1.rIssuer1',
          toAsset: 'TOKEN2.rIssuer2',
          fromAmount: 1000,
          toAmount: 800,
        },
        {
          hash: 'hash2',
          txCloseTime: closeTime,
          fromAsset: 'TOKEN2.rIssuer2',
          toAsset: 'TOKEN3.rIssuer3',
          fromAmount: 800,
          toAmount: 600,
        },
        {
          hash: 'hash3',
          txCloseTime: closeTime,
          fromAsset: 'TOKEN3.rIssuer3',
          toAsset: 'XRP',
          fromAmount: 600,
          toAmount: 400,
        },
      ];

      const finalSoldQty = 200;
      const finalProceedsXRP = 150;

      const result = service.buildChainTree(
        chain,
        finalSoldQty,
        finalProceedsXRP,
      );

      expect(result).toHaveLength(3);

      // Last step (hash3)
      expect(result[2]?.proportionalFromAmount).toBe(finalSoldQty);
      expect(result[2]?.proportionalToAmount).toBe(finalProceedsXRP);

      // Middle step (hash2)
      const proportion2 = finalSoldQty / 600; // 200 / 600 = 0.333...
      expect(result[1]?.proportionalFromAmount).toBeCloseTo(800 * proportion2);
      expect(result[1]?.proportionalToAmount).toBe(finalSoldQty);

      // First step (hash1)
      const currentQtyAfterStep2 = 800 * proportion2;
      const proportion1 = currentQtyAfterStep2 / 800;
      expect(result[0]?.proportionalFromAmount).toBeCloseTo(1000 * proportion1);
      expect(result[0]?.proportionalToAmount).toBeCloseTo(currentQtyAfterStep2);
    });

    it('should not modify original chain array', () => {
      const closeTime = DateTime.now();
      const chain: ChainStep[] = [
        {
          hash: 'hash1',
          txCloseTime: closeTime,
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: 100,
          toAmount: 50,
        },
      ];

      const originalChain = chain.map((step) => ({ ...step }));
      service.buildChainTree(chain, 30, 15);

      expect(chain[0]?.proportionalFromAmount).toBeUndefined();
      expect(chain[0]?.proportionalToAmount).toBeUndefined();
      // Check that original chain doesn't have proportional fields
      expect(originalChain[0]?.proportionalFromAmount).toBeUndefined();
      expect(originalChain[0]?.proportionalToAmount).toBeUndefined();
    });
  });
});
