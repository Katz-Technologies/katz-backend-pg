import { Test, TestingModule } from '@nestjs/testing';
import { TagsDomain } from './tags.domain';
import { SmartMoneySummary } from 'src/services/smart-money/type/smart-money-summary.type';
import { DateTime } from 'luxon';
import { ETagOtherMetrics } from 'src/services/smart-money/enum/tag-other-metrics.enum';
import { ETagTraderType } from 'src/services/smart-money/enum/tag-trader-type.enum';
import { ETagWinrate } from 'src/services/smart-money/enum/tag-winrate.enum';
import { ETagTotalPnl } from 'src/services/smart-money/enum/tag-total-pnl.enum';
import { ETagAvgRoi } from 'src/services/smart-money/enum/tag-avg-roi.enum';
import { ETagTotalVolume } from 'src/services/smart-money/enum/tag-total-volume.enum';
import { ETagGroupVolume } from 'src/services/smart-money/enum/tag-group-volume.enum';
import { CTagOtherMetricsConfig } from 'src/services/smart-money/const/tag-other-metrics-config.const';
import { SaleData } from 'src/services/smart-money/type/sale-data.type';
import { BalancesData } from 'src/services/smart-money/type/balances-data.type';
import { VolumesData } from 'src/services/smart-money/type/volumes-data.type';
import { SaleVolumeData } from 'src/services/smart-money/type/sale-volume-data.type';

describe('TagsDomain', () => {
  let service: TagsDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsDomain],
    }).compile();

    service = module.get<TagsDomain>(TagsDomain);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTags', () => {
    it('should return default tags for empty summary', () => {
      const summary: SmartMoneySummary = createEmptySummary();

      const result = service.getTags(summary);

      expect(result.length).toBeGreaterThan(0);
      expect(summary.tags.length).toBeGreaterThan(0);
      expect(result).toContain(ETagTraderType.PassiveTrader);
    });

    it('should handle errors gracefully', () => {
      const summary = null as unknown as SmartMoneySummary;

      const result = service.getTags(summary);

      expect(result).toEqual([]);
    });

    it('should set tags on summary object', () => {
      const summary = createSummaryWithWhale();

      service.getTags(summary);

      expect(summary.tags).toBeDefined();
      expect(Array.isArray(summary.tags)).toBe(true);
    });
  });

  describe('manageWhale', () => {
    it('should add Whale tag when sale amount >= 500', () => {
      const summary = createSummaryWithWhale();

      service.getTags(summary);

      expect(summary.tags).toContain(ETagOtherMetrics.Whale);
    });

    it('should not add Whale tag when all sales < 500', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: [
          {
            qty: 100,
            fromAmount: 400,
            toAmount: 500,
            fromAmountUsd: 400,
            toAmountUsd: 500,
            pnl: 100,
            pnlUsd: 100,
            roi: 0.25,
            chain: [],
          },
        ],
      };

      service.getTags(summary);

      expect(summary.tags).not.toContain(ETagOtherMetrics.Whale);
    });

    it('should add Whale tag when at least one sale >= 500', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: [
          {
            qty: 100,
            fromAmount: 400,
            toAmount: 500,
            fromAmountUsd: 400,
            toAmountUsd: 500,
            pnl: 100,
            pnlUsd: 100,
            roi: 0.25,
            chain: [],
          },
          {
            qty: 200,
            fromAmount: CTagOtherMetricsConfig.Whale,
            toAmount: 600,
            fromAmountUsd: CTagOtherMetricsConfig.Whale,
            toAmountUsd: 600,
            pnl: 100,
            pnlUsd: 100,
            roi: 0.25,
            chain: [],
          },
        ],
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagOtherMetrics.Whale);
    });
  });

  describe('manageTraderType', () => {
    it('should add PassiveTrader tag when no sales', () => {
      const summary = createEmptySummary();

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTraderType.PassiveTrader);
    });

    it('should add PassiveTrader tag when sales have no chain', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: [
          {
            qty: 100,
            fromAmount: 100,
            toAmount: 150,
            fromAmountUsd: 100,
            toAmountUsd: 150,
            pnl: 50,
            pnlUsd: 50,
            roi: 0.5,
            chain: [],
          },
        ],
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTraderType.PassiveTrader);
    });

    it('should add Bot tag when avgPositionsPerDay > 200', () => {
      const now = DateTime.now();
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: Array.from({ length: 250 }, (_, i) => ({
          qty: 100,
          fromAmount: 100,
          toAmount: 150,
          fromAmountUsd: 100,
          toAmountUsd: 150,
          pnl: 50,
          pnlUsd: 50,
          roi: 0.5,
          chain: [
            {
              hash: `hash${i}`,
              txCloseTime: now.minus({ days: 1 }).plus({ minutes: i }),
              fromAsset: 'USD.rIssuer',
              toAsset: 'XRP',
              fromAmount: 100,
              toAmount: 150,
            },
          ],
        })),
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTraderType.Bot);
    });

    it('should add ActiveTrader tag when avgPositionsPerDay > 50 and <= 200', () => {
      const now = DateTime.now();
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: Array.from({ length: 60 }, (_, i) => ({
          qty: 100,
          fromAmount: 100,
          toAmount: 150,
          fromAmountUsd: 100,
          toAmountUsd: 150,
          pnl: 50,
          pnlUsd: 50,
          roi: 0.5,
          chain: [
            {
              hash: `hash${i}`,
              txCloseTime: now.minus({ days: 1 }).plus({ minutes: i }),
              fromAsset: 'USD.rIssuer',
              toAsset: 'XRP',
              fromAmount: 100,
              toAmount: 150,
            },
          ],
        })),
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTraderType.ActiveTrader);
    });

    it('should add BacisTrader tag when avgPositionsPerDay > 10 and <= 50', () => {
      const now = DateTime.now();
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: Array.from({ length: 20 }, (_, i) => ({
          qty: 100,
          fromAmount: 100,
          toAmount: 150,
          fromAmountUsd: 100,
          toAmountUsd: 150,
          pnl: 50,
          pnlUsd: 50,
          roi: 0.5,
          chain: [
            {
              hash: `hash${i}`,
              txCloseTime: now.minus({ days: 1 }).plus({ hours: i }),
              fromAsset: 'USD.rIssuer',
              toAsset: 'XRP',
              fromAmount: 100,
              toAmount: 150,
            },
          ],
        })),
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTraderType.BacisTrader);
    });

    it('should handle DateTime string format', () => {
      const now = DateTime.now();
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: [
          {
            qty: 100,
            fromAmount: 100,
            toAmount: 150,
            fromAmountUsd: 100,
            toAmountUsd: 150,
            pnl: 50,
            pnlUsd: 50,
            roi: 0.5,
            chain: [
              {
                hash: 'hash1',
                txCloseTime: now
                  .minus({ days: 2 })
                  .toFormat('yyyy-MM-dd HH:mm:ss.SSS') as unknown as DateTime,
                fromAsset: 'USD.rIssuer',
                toAsset: 'XRP',
                fromAmount: 100,
                toAmount: 150,
              },
            ],
          },
          {
            qty: 100,
            fromAmount: 100,
            toAmount: 150,
            fromAmountUsd: 100,
            toAmountUsd: 150,
            pnl: 50,
            pnlUsd: 50,
            roi: 0.5,
            chain: [
              {
                hash: 'hash2',
                txCloseTime: now.toFormat(
                  'yyyy-MM-dd HH:mm:ss.SSS',
                ) as unknown as DateTime,
                fromAsset: 'USD.rIssuer',
                toAsset: 'XRP',
                fromAmount: 100,
                toAmount: 150,
              },
            ],
          },
        ],
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTraderType.PassiveTrader);
    });
  });

  describe('manageWinrate', () => {
    it('should add VeryHighWinrate tag when winrate > 90', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        winrate: 95,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagWinrate.VeryHighWinrate);
    });

    it('should add HighWinrate tag when winrate > 75 and <= 90', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        winrate: 80,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagWinrate.HighWinrate);
    });

    it('should add MidWinrate tag when winrate > 50 and <= 75', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        winrate: 60,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagWinrate.MidWinrate);
    });

    it('should add LowWinrate tag when winrate <= 50', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        winrate: 40,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagWinrate.LowWinrate);
    });
  });

  describe('manageTotalPnl', () => {
    it('should add VeryHighPnl tag when totalPnl > 100', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalPnl: 150,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalPnl.VeryHighPnl);
    });

    it('should add HighPnl tag when totalPnl > 50 and <= 100', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalPnl: 75,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalPnl.HighPnl);
    });

    it('should add MidPnl tag when totalPnl > 10 and <= 50', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalPnl: 25,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalPnl.MidPnl);
    });

    it('should add LowPnl tag when totalPnl > 0 and <= 10', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalPnl: 5,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalPnl.LowPnl);
    });

    it('should add NegativePnl tag when totalPnl <= 0', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalPnl: -10,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalPnl.NegativePnl);
    });
  });

  describe('manageAvgRoi', () => {
    it('should add VeryHighRoi tag when avgRoi > 0.3', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        avgRoi: 0.5,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagAvgRoi.VeryHighRoi);
    });

    it('should add HighRoi tag when avgRoi > 0.1 and <= 0.3', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        avgRoi: 0.2,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagAvgRoi.HighRoi);
    });

    it('should add MidRoi tag when avgRoi > 0.05 and <= 0.1', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        avgRoi: 0.08,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagAvgRoi.MidRoi);
    });

    it('should add LowRoi tag when avgRoi <= 0.05', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        avgRoi: 0.02,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagAvgRoi.LowRoi);
    });
  });

  describe('manageTotalVolume', () => {
    it('should add VeryHighTotalVolume tag when totalVolume > 10000', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalVolume: 15000,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalVolume.VeryHighTotalVolume);
    });

    it('should add HighTotalVolume tag when totalVolume > 1000 and <= 10000', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalVolume: 5000,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalVolume.HighTotalVolume);
    });

    it('should add MidTotalVolume tag when totalVolume > 100 and <= 1000', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalVolume: 500,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalVolume.MidTotalVolume);
    });

    it('should add LowTotalVolume tag when totalVolume <= 100', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        totalVolume: 50,
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagTotalVolume.LowTotalVolume);
    });
  });

  describe('manageGroupVolume', () => {
    it('should add SmallGroupVolume tag when tokensWithHighVolume < 5', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        saleVolumes: {
          'TOKEN1.rIssuer1': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN2.rIssuer2': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN3.rIssuer3': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
        },
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagGroupVolume.SmallGroupVolume);
    });

    it('should add BigGroupVolume tag when tokensWithHighVolume >= 5', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        saleVolumes: {
          'TOKEN1.rIssuer1': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN2.rIssuer2': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN3.rIssuer3': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN4.rIssuer4': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN5.rIssuer5': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
        },
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagGroupVolume.BigGroupVolume);
    });

    it('should ignore tokens with totalVolume <= 100', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        saleVolumes: {
          'TOKEN1.rIssuer1': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 50,
            pnl: 0,
          },
          'TOKEN2.rIssuer2': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 50,
            pnl: 0,
          },
          'TOKEN3.rIssuer3': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 50,
            pnl: 0,
          },
          'TOKEN4.rIssuer4': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 50,
            pnl: 0,
          },
          'TOKEN5.rIssuer5': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 50,
            pnl: 0,
          },
        },
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagGroupVolume.SmallGroupVolume);
    });

    it('should handle undefined volumes', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        saleVolumes: {
          'TOKEN1.rIssuer1': undefined as unknown as SaleVolumeData,
          'TOKEN2.rIssuer2': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
        },
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagGroupVolume.SmallGroupVolume);
    });
  });

  describe('combined tags', () => {
    it('should add multiple tags for complex summary', () => {
      const summary: SmartMoneySummary = {
        ...createEmptySummary(),
        sales: [
          {
            qty: 100,
            fromAmount: CTagOtherMetricsConfig.Whale,
            toAmount: 600,
            fromAmountUsd: CTagOtherMetricsConfig.Whale,
            toAmountUsd: 600,
            pnl: 100,
            pnlUsd: 100,
            roi: 0.25,
            chain: [],
          },
        ],
        winrate: 95,
        totalPnl: 150,
        avgRoi: 0.5,
        totalVolume: 15000,
        saleVolumes: {
          'TOKEN1.rIssuer1': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN2.rIssuer2': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN3.rIssuer3': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN4.rIssuer4': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
          'TOKEN5.rIssuer5': {
            fromVolume: 50,
            toVolume: 50,
            totalVolume: 150,
            pnl: 0,
          },
        },
      };

      service.getTags(summary);

      expect(summary.tags).toContain(ETagOtherMetrics.Whale);
      expect(summary.tags).toContain(ETagTraderType.PassiveTrader);
      expect(summary.tags).toContain(ETagWinrate.VeryHighWinrate);
      expect(summary.tags).toContain(ETagTotalPnl.VeryHighPnl);
      expect(summary.tags).toContain(ETagAvgRoi.VeryHighRoi);
      expect(summary.tags).toContain(ETagTotalVolume.VeryHighTotalVolume);
      expect(summary.tags).toContain(ETagGroupVolume.BigGroupVolume);
    });
  });
});

// Helper functions
function createEmptySummary(): SmartMoneySummary {
  return {
    address: 'rTestAddress',
    totalPnl: 0,
    totalPnlUsd: 0,
    avgPnl: 0,
    avgPnlUsd: 0,
    avgBuy: 0,
    avgBuyUsd: 0,
    avgSale: 0,
    avgSaleUsd: 0,
    avgRoi: 0,
    positiveCount: 0,
    negativeCount: 0,
    totalCount: 0,
    winrate: 0,
    buyVolume: 0,
    buyVolumeUsd: 0,
    saleVolume: 0,
    saleVolumeUsd: 0,
    totalVolume: 0,
    totalVolumeUsd: 0,
    sales: [],
    minPNL: null as unknown as SaleData,
    maxPNL: null as unknown as SaleData,
    tags: [],
    balances: {} as BalancesData,
    volumes: {} as VolumesData,
    saleVolumes: {},
  };
}

function createSummaryWithWhale(): SmartMoneySummary {
  return {
    ...createEmptySummary(),
    sales: [
      {
        qty: 100,
        fromAmount: CTagOtherMetricsConfig.Whale,
        toAmount: 600,
        fromAmountUsd: CTagOtherMetricsConfig.Whale,
        toAmountUsd: 600,
        pnl: 100,
        pnlUsd: 100,
        roi: 0.25,
        chain: [],
      },
    ],
  };
}
