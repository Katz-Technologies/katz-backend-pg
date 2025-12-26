import { Test, TestingModule } from '@nestjs/testing';
import { SalesDomain } from './sales.domain';
import { ChainDomain } from '../chain/chain.domain';
import { ProcessedMoneyFlowRow } from 'src/services/smart-money/type/processed-money-flow-row.type';
import { PurchaseData } from 'src/services/smart-money/type/purchase-data.type';
import { SaleData } from 'src/services/smart-money/type/sale-data.type';
import { Deque } from 'src/common/deque/deque.class';
import { DateTime } from 'luxon';

describe('SalesDomain', () => {
  let service: SalesDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesDomain, ChainDomain],
    }).compile();

    service = module.get<SalesDomain>(SalesDomain);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPurchase', () => {
    it('should add purchase to new deque when asset does not exist', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
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

      service.addPurchase(purchases, moneyFlow);

      expect(purchases.has('XRP')).toBe(true);
      const deque = purchases.get('XRP');
      expect(deque).toBeDefined();
      expect(deque?.size).toBe(1);
      const purchase = deque?.toJSON()[0];
      expect(purchase?.qty).toBe(50);
      expect(purchase?.fromAmount).toBe(-100);
      expect(purchase?.chain).toHaveLength(1);
      expect(purchase?.chain[0]?.hash).toBe('test-hash');
    });

    it('should add purchase to existing deque when asset exists', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const existingDeque = new Deque<PurchaseData>();
      existingDeque.pushFront({
        qty: 30,
        fromAmount: -60,
        chain: [],
      });
      purchases.set('XRP', existingDeque);

      const closeTime = DateTime.now();
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'test-hash-2',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'EUR.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 100,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.addPurchase(purchases, moneyFlow);

      expect(purchases.get('XRP')?.size).toBe(2);
      const purchasesArray = purchases.get('XRP')?.toJSON();
      expect(purchasesArray?.[0]?.qty).toBe(50); // New purchase added to front
      expect(purchasesArray?.[1]?.qty).toBe(30); // Old purchase
    });

    it('should create chain step for purchase', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
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

      service.addPurchase(purchases, moneyFlow);

      const purchase = purchases.get('XRP')?.toJSON()[0];
      expect(purchase?.chain).toHaveLength(1);
      expect(purchase?.chain[0]?.hash).toBe('test-hash');
      expect(purchase?.chain[0]?.fromAsset).toBe('USD.rIssuer');
      expect(purchase?.chain[0]?.toAsset).toBe('XRP');
      expect(purchase?.chain[0]?.fromAmount).toBe(100); // Math.abs(-100)
      expect(purchase?.chain[0]?.toAmount).toBe(50);
    });
  });

  describe('addSale', () => {
    it('should not add sale when no purchases exist', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const sales: SaleData[] = [];
      const closeTime = DateTime.now();
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'XRP',
        toAsset: 'USD.rIssuer',
        fromAmount: -50,
        toAmount: 100,
        initFromAmount: 50,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      service.addSale(purchases, sales, moneyFlow);

      expect(sales).toHaveLength(0);
    });

    it('should add sale with full purchase quantity (FIFO)', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const deque = new Deque<PurchaseData>();
      const closeTime = DateTime.now();
      deque.pushFront({
        qty: 50,
        fromAmount: -100,
        chain: [
          {
            hash: 'purchase-hash',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'XRP',
            fromAmount: 100,
            toAmount: 50,
          },
        ],
      });
      purchases.set('XRP', deque);

      const sales: SaleData[] = [];
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'sale-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'XRP',
        toAsset: 'USD.rIssuer',
        fromAmount: -50,
        toAmount: 120,
        initFromAmount: 50,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.addSale(purchases, sales, moneyFlow);

      expect(sales).toHaveLength(1);
      expect(sales[0]?.qty).toBe(50);
      expect(sales[0]?.fromAmount).toBe(100);
      expect(sales[0]?.toAmount).toBe(120);
      expect(sales[0]?.pnl).toBe(20);
      expect(sales[0]?.roi).toBe(0.2);
      expect(sales[0]?.chain).toHaveLength(2); // purchase + sale
      expect(purchases.get('XRP')?.size).toBe(0); // Purchase consumed
    });

    it('should add sale with partial purchase quantity (FIFO)', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const deque = new Deque<PurchaseData>();
      const closeTime = DateTime.now();
      deque.pushFront({
        qty: 100,
        fromAmount: -200,
        chain: [
          {
            hash: 'purchase-hash',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'XRP',
            fromAmount: 200,
            toAmount: 100,
          },
        ],
      });
      purchases.set('XRP', deque);

      const sales: SaleData[] = [];
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'sale-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'XRP',
        toAsset: 'USD.rIssuer',
        fromAmount: -30,
        toAmount: 80,
        initFromAmount: 30,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.addSale(purchases, sales, moneyFlow);

      expect(sales).toHaveLength(1);
      expect(sales[0]?.qty).toBe(30);
      expect(sales[0]?.fromAmount).toBe(60);
      expect(sales[0]?.toAmount).toBe(80);
      expect(sales[0]?.pnl).toBe(20);
      expect(purchases.get('XRP')?.size).toBe(1); // Remaining purchase
      const remainingPurchase = purchases.get('XRP')?.toJSON()[0];
      expect(remainingPurchase?.qty).toBe(70); // 100 - 30
      expect(remainingPurchase?.fromAmount).toBe(-140); // -200 + 60
    });

    it('should handle multiple purchases with FIFO', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const deque = new Deque<PurchaseData>();
      const closeTime = DateTime.now();
      // First purchase (oldest)
      deque.pushFront({
        qty: 50,
        fromAmount: -100,
        chain: [
          {
            hash: 'purchase-1',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'XRP',
            fromAmount: 100,
            toAmount: 50,
          },
        ],
      });
      // Second purchase (newer)
      deque.pushFront({
        qty: 30,
        fromAmount: -80,
        chain: [
          {
            hash: 'purchase-2',
            txCloseTime: closeTime.plus({ minutes: 1 }),
            fromAsset: 'EUR.rIssuer',
            toAsset: 'XRP',
            fromAmount: 80,
            toAmount: 30,
          },
        ],
      });
      purchases.set('XRP', deque);

      const sales: SaleData[] = [];
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'sale-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'XRP',
        toAsset: 'USD.rIssuer',
        fromAmount: -70,
        toAmount: 200,
        initFromAmount: 70,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12347,
        inLedgerIndex: 0,
      };

      service.addSale(purchases, sales, moneyFlow);

      // Should consume both purchases (FIFO: oldest first, then newest)
      // Note: pushFront adds to front, popBack removes from back, so oldest is at back
      expect(sales).toHaveLength(2);
      // First sale from oldest purchase (50 qty)
      expect(sales[0]?.qty).toBe(50);
      expect(sales[0]?.fromAmount).toBe(100);
      // Second sale from newest purchase (20 qty from 30)
      expect(sales[1]?.qty).toBe(20);
      expect(sales[1]?.fromAmount).toBeCloseTo(53.33, 2); // (80 * 20) / 30
      expect(purchases.get('XRP')?.size).toBe(1); // Remaining 10 from newest
    });

    it('should not add sale when proceeds is too small', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const deque = new Deque<PurchaseData>();
      const closeTime = DateTime.now();
      deque.pushFront({
        qty: 50,
        fromAmount: -100,
        chain: [
          {
            hash: 'purchase-hash',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'XRP',
            fromAmount: 100,
            toAmount: 50,
          },
        ],
      });
      purchases.set('XRP', deque);

      const sales: SaleData[] = [];
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'sale-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'XRP',
        toAsset: 'USD.rIssuer',
        fromAmount: -50,
        toAmount: 0.0000001, // Very small proceeds
        initFromAmount: 50,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.addSale(purchases, sales, moneyFlow);

      expect(sales).toHaveLength(0); // Sale not added due to small proceeds
    });

    it('should calculate USD amounts correctly', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const deque = new Deque<PurchaseData>();
      const closeTime = DateTime.now();
      deque.pushFront({
        qty: 50,
        fromAmount: -100,
        chain: [
          {
            hash: 'purchase-hash',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'XRP',
            fromAmount: 100,
            toAmount: 50,
          },
        ],
      });
      purchases.set('XRP', deque);

      const sales: SaleData[] = [];
      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'sale-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'XRP',
        toAsset: 'USD.rIssuer',
        fromAmount: -50,
        toAmount: 120,
        initFromAmount: 50,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.5,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.addSale(purchases, sales, moneyFlow);

      expect(sales[0]?.fromAmountUsd).toBe(150); // 100 * 1.5
      expect(sales[0]?.toAmountUsd).toBe(180); // 120 * 1.5
      expect(sales[0]?.pnlUsd).toBe(30); // 20 * 1.5
    });
  });

  describe('manageNonXrpSwap', () => {
    it('should handle swap between non-XRP tokens', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const closeTime = DateTime.now();
      const fromDeque = new Deque<PurchaseData>();
      fromDeque.pushFront({
        qty: 100,
        fromAmount: -200,
        chain: [
          {
            hash: 'purchase-hash',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'TOKEN1.rIssuer1',
            fromAmount: 200,
            toAmount: 100,
          },
        ],
      });
      purchases.set('TOKEN1.rIssuer1', fromDeque);

      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'swap-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'TOKEN1.rIssuer1',
        toAsset: 'TOKEN2.rIssuer2',
        fromAmount: -50,
        toAmount: 60,
        initFromAmount: 50,
        initToAmount: 0,
        kind: 'swap',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.manageNonXrpSwap(purchases, moneyFlow);

      // Should consume from TOKEN1 and add to TOKEN2
      expect(purchases.get('TOKEN1.rIssuer1')?.size).toBe(1); // Remaining 50
      expect(purchases.has('TOKEN2.rIssuer2')).toBe(true);
      const toDeque = purchases.get('TOKEN2.rIssuer2');
      expect(toDeque?.size).toBe(1);
      const newPurchase = toDeque?.toJSON()[0];
      expect(newPurchase?.qty).toBe(60);
      expect(newPurchase?.fromAmount).toBe(-100); // (200 * 50) / 100, negative because it's a cost
      expect(newPurchase?.chain).toHaveLength(2); // Original chain + swap step
    });

    it('should handle partial swap', () => {
      const purchases = new Map<string, Deque<PurchaseData>>();
      const closeTime = DateTime.now();
      const fromDeque = new Deque<PurchaseData>();
      fromDeque.pushFront({
        qty: 100,
        fromAmount: -200,
        chain: [
          {
            hash: 'purchase-hash',
            txCloseTime: closeTime,
            fromAsset: 'USD.rIssuer',
            toAsset: 'TOKEN1.rIssuer1',
            fromAmount: 200,
            toAmount: 100,
          },
        ],
      });
      purchases.set('TOKEN1.rIssuer1', fromDeque);

      const moneyFlow: ProcessedMoneyFlowRow = {
        hash: 'swap-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'TOKEN1.rIssuer1',
        toAsset: 'TOKEN2.rIssuer2',
        fromAmount: -30,
        toAmount: 40,
        initFromAmount: 30,
        initToAmount: 0,
        kind: 'swap',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12346,
        inLedgerIndex: 0,
      };

      service.manageNonXrpSwap(purchases, moneyFlow);

      // Should leave remaining in TOKEN1
      const remaining = purchases.get('TOKEN1.rIssuer1')?.toJSON()[0];
      expect(remaining?.qty).toBe(70); // 100 - 30
      expect(remaining?.fromAmount).toBe(-140); // -200 + 60
    });
  });

  describe('getSalesByAsset', () => {
    it('should return empty array for empty money flows', () => {
      const result = service.getSalesByAsset([], 'XRP');

      expect(result).toEqual([]);
    });

    it('should process purchase and sale correctly', () => {
      const closeTime = DateTime.now();
      const moneyFlows: ProcessedMoneyFlowRow[] = [
        {
          hash: 'purchase-hash',
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
        },
        {
          hash: 'sale-hash',
          fromAddress: 'rAddress2',
          toAddress: 'rAddress3',
          fromAsset: 'XRP',
          toAsset: 'USD.rIssuer',
          fromAmount: -50,
          toAmount: 120,
          initFromAmount: 50,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime: closeTime.plus({ minutes: 1 }),
          ledgerIndex: 12346,
          inLedgerIndex: 0,
        },
      ];

      const result = service.getSalesByAsset(moneyFlows, 'XRP');

      expect(result).toHaveLength(1);
      expect(result[0]?.qty).toBe(50);
      expect(result[0]?.pnl).toBe(20); // 120 - 100
      expect(result[0]?.fromAmount).toBe(100);
      expect(result[0]?.toAmount).toBe(120);
    });

    it('should handle non-XRP swap', () => {
      const closeTime = DateTime.now();
      const moneyFlows: ProcessedMoneyFlowRow[] = [
        {
          hash: 'purchase-hash',
          fromAddress: 'rAddress1',
          toAddress: 'rAddress2',
          fromAsset: 'USD.rIssuer',
          toAsset: 'TOKEN1.rIssuer1',
          fromAmount: -100,
          toAmount: 50,
          initFromAmount: 100,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime,
          ledgerIndex: 12345,
          inLedgerIndex: 0,
        },
        {
          hash: 'swap-hash',
          fromAddress: 'rAddress2',
          toAddress: 'rAddress3',
          fromAsset: 'TOKEN1.rIssuer1',
          toAsset: 'TOKEN2.rIssuer2',
          fromAmount: -50,
          toAmount: 60,
          initFromAmount: 50,
          initToAmount: 0,
          kind: 'swap',
          xrpPrice: 1.0,
          closeTime: closeTime.plus({ minutes: 1 }),
          ledgerIndex: 12346,
          inLedgerIndex: 0,
        },
      ];

      const result = service.getSalesByAsset(moneyFlows, 'XRP');

      expect(result).toHaveLength(0); // No sales for XRP
    });
  });

  describe('getSaleVolumes', () => {
    it('should return empty object for empty sales', () => {
      const result = service.getSaleVolumes([]);

      expect(result).toEqual({});
    });

    it('should calculate volumes correctly', () => {
      const closeTime = DateTime.now();
      const sales: SaleData[] = [
        {
          qty: 50,
          fromAmount: -100,
          toAmount: 120,
          fromAmountUsd: -100,
          toAmountUsd: 120,
          pnl: 20,
          pnlUsd: 20,
          roi: 0.2,
          chain: [
            {
              hash: 'purchase-hash',
              txCloseTime: closeTime,
              fromAsset: 'USD.rIssuer',
              toAsset: 'XRP',
              fromAmount: 100,
              toAmount: 50,
              proportionalFromAmount: 100,
              proportionalToAmount: 50,
            },
            {
              hash: 'sale-hash',
              txCloseTime: closeTime.plus({ minutes: 1 }),
              fromAsset: 'XRP',
              toAsset: 'USD.rIssuer',
              fromAmount: 50,
              toAmount: 120,
              proportionalFromAmount: 50,
              proportionalToAmount: 120,
            },
          ],
        },
      ];

      const result = service.getSaleVolumes(sales);

      expect(result['USD.rIssuer']).toBeDefined();
      expect(result['USD.rIssuer']?.fromVolume).toBe(100);
      expect(result['USD.rIssuer']?.toVolume).toBe(120);
      expect(result['USD.rIssuer']?.totalVolume).toBe(220);
      expect(result['USD.rIssuer']?.pnl).toBe(20);

      expect(result['XRP']).toBeDefined();
      expect(result['XRP']?.fromVolume).toBe(100);
      expect(result['XRP']?.toVolume).toBe(120);
      expect(result['XRP']?.totalVolume).toBe(220);
      expect(result['XRP']?.pnl).toBe(20);
    });

    it('should sort volumes by PnL descending', () => {
      const closeTime = DateTime.now();
      const sales: SaleData[] = [
        {
          qty: 50,
          fromAmount: -100,
          toAmount: 120,
          fromAmountUsd: -100,
          toAmountUsd: 120,
          pnl: 20,
          pnlUsd: 20,
          roi: 0.2,
          chain: [
            {
              hash: 'purchase-hash',
              txCloseTime: closeTime,
              fromAsset: 'TOKEN1.rIssuer1',
              toAsset: 'XRP',
              fromAmount: 100,
              toAmount: 50,
              proportionalFromAmount: 100,
              proportionalToAmount: 50,
            },
            {
              hash: 'sale-hash',
              txCloseTime: closeTime.plus({ minutes: 1 }),
              fromAsset: 'XRP',
              toAsset: 'TOKEN1.rIssuer1',
              fromAmount: 50,
              toAmount: 120,
              proportionalFromAmount: 50,
              proportionalToAmount: 120,
            },
          ],
        },
        {
          qty: 30,
          fromAmount: -50,
          toAmount: 80,
          fromAmountUsd: -50,
          toAmountUsd: 80,
          pnl: 30,
          pnlUsd: 30,
          roi: 0.6,
          chain: [
            {
              hash: 'purchase-hash-2',
              txCloseTime: closeTime,
              fromAsset: 'TOKEN2.rIssuer2',
              toAsset: 'XRP',
              fromAmount: 50,
              toAmount: 30,
              proportionalFromAmount: 50,
              proportionalToAmount: 30,
            },
            {
              hash: 'sale-hash-2',
              txCloseTime: closeTime.plus({ minutes: 2 }),
              fromAsset: 'XRP',
              toAsset: 'TOKEN2.rIssuer2',
              fromAmount: 30,
              toAmount: 80,
              proportionalFromAmount: 30,
              proportionalToAmount: 80,
            },
          ],
        },
      ];

      const result = service.getSaleVolumes(sales);

      const tokens = Object.keys(result);
      // XRP should come first (highest PnL: 50 = 20 + 30 from both sales)
      // TOKEN2 should come second (higher PnL: 30 vs 20)
      // TOKEN1 should come third (PnL: 20)
      expect(tokens).toContain('XRP');
      expect(tokens).toContain('TOKEN2.rIssuer2');
      expect(tokens).toContain('TOKEN1.rIssuer1');
      // XRP has highest PnL (50), so it should be first
      expect(tokens[0]).toBe('XRP');
      // Find positions of TOKEN1 and TOKEN2
      const token1Index = tokens.indexOf('TOKEN1.rIssuer1');
      const token2Index = tokens.indexOf('TOKEN2.rIssuer2');
      expect(token2Index).toBeLessThan(token1Index); // TOKEN2 should come before TOKEN1
    });

    it('should skip sales without chain', () => {
      const sales: SaleData[] = [
        {
          qty: 50,
          fromAmount: -100,
          toAmount: 120,
          fromAmountUsd: -100,
          toAmountUsd: 120,
          pnl: 20,
          pnlUsd: 20,
          roi: 0.2,
          chain: [],
        },
      ];

      const result = service.getSaleVolumes(sales);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
