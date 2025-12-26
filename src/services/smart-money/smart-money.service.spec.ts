jest.mock('../../common/clickhouse/clickhouse.service', () => ({
  ClickhouseService: jest.fn().mockImplementation(() => ({
    getAllTokens: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SmartMoneyService } from './smart-money.service';
import { ClickhouseService } from '../../common/clickhouse/clickhouse.service';
import { REDIS_TOKENS } from '../../common/redis/redis.tokens';
import type { RedisService } from '../../common/redis/redis.service';
import { SaleData } from './type/sale-data.type';
import { MoneyFlowRow } from './interface/money-flow-row.interface';
import { TokenSummary, VolumeChartPoint } from './type/token-summary.type';
import { SmartMoneySummary } from './type/smart-money-summary.type';
import { TopTokenData } from './type/top-token-data.type';
import { TokenChartsResponse } from './interface/token-charts-response.interface';

describe('SmartMoneyService', () => {
  let service: SmartMoneyService;
  let clickhouseService: jest.Mocked<ClickhouseService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockClickhouseService = {
      getAllTokens: jest.fn().mockResolvedValue(['USD.rTest', 'EUR.rTest']),
    };

    const mockRedisService = {
      getAsJson: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartMoneyService,
        {
          provide: ClickhouseService,
          useValue: mockClickhouseService,
        },
        {
          provide: REDIS_TOKENS.EXTERNAL,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SmartMoneyService>(SmartMoneyService);
    clickhouseService = module.get(ClickhouseService);
    redisService = module.get(REDIS_TOKENS.EXTERNAL);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSales', () => {
    const mockSaleData: SaleData = {
      qty: 100,
      fromAmount: 50,
      toAmount: 60,
      fromAmountUsd: 50,
      toAmountUsd: 60,
      pnl: 10,
      pnlUsd: 10,
      roi: 20,
      chain: [],
    };

    it('should get sales from Redis with correct pagination', async () => {
      const address = 'rTest123';
      const limit = 5;
      const offset = 0;

      redisService.getAsJson
        .mockResolvedValueOnce(10) // maxIndex
        .mockResolvedValueOnce(mockSaleData) // sale:1
        .mockResolvedValueOnce(mockSaleData) // sale:2
        .mockResolvedValueOnce(mockSaleData); // sale:3

      const result = await service.getSales(address, limit, offset);

      expect(redisService.getAsJson).toHaveBeenCalledWith(
        `summary:${address}:sale:length`,
      );
      expect(result).toHaveLength(3);
    });

    it('should handle offset correctly', async () => {
      const address = 'rTest123';
      const limit = 3;
      const offset = 2;

      redisService.getAsJson
        .mockResolvedValueOnce(10) // maxIndex
        .mockResolvedValueOnce(mockSaleData) // sale:3
        .mockResolvedValueOnce(mockSaleData); // sale:4

      await service.getSales(address, limit, offset);

      expect(redisService.getAsJson).toHaveBeenCalledWith(
        `summary:${address}:sale:3`,
      );
    });

    it('should stop when sale is null', async () => {
      const address = 'rTest123';
      const limit = 5;
      const offset = 0;

      redisService.getAsJson
        .mockResolvedValueOnce(10) // maxIndex
        .mockResolvedValueOnce(mockSaleData) // sale:1
        .mockResolvedValueOnce(null); // sale:2 - null, should break

      const result = await service.getSales(address, limit, offset);

      expect(result).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      const address = 'rTest123';
      const limit = 5;
      const offset = 0;

      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.getSales(address, limit, offset)).rejects.toThrow(
        'Redis error',
      );
    });
  });

  describe('getMoneyFlowsFromRedis', () => {
    const mockMoneyFlow: MoneyFlowRow = {
      from_address: 'rTest1',
      to_address: 'rTest2',
      from_asset: 'XRP',
      to_asset: 'USD.rTest',
      from_amount: '100',
      to_amount: '50',
      init_from_amount: '100',
      init_to_amount: '50',
      price_usd: '1.0',
      kind: 'transfer',
      close_time: '2024-01-01 00:00:00.000',
      ledger_index: 123456,
      in_ledger_index: 0,
      tx_hash: 'test_hash',
    };

    it('should get money flows from Redis', async () => {
      const address = 'rTest123';
      const limit = 3;
      const offset = 0;

      redisService.getAsJson
        .mockResolvedValueOnce(5) // maxIndex
        .mockResolvedValueOnce(mockMoneyFlow) // mf:1
        .mockResolvedValueOnce(mockMoneyFlow) // mf:2
        .mockResolvedValueOnce(mockMoneyFlow); // mf:3

      const result = await service.getMoneyFlowsFromRedis(
        address,
        limit,
        offset,
      );

      expect(redisService.getAsJson).toHaveBeenCalledWith(
        `history:${address}:mf:length`,
      );
      expect(result).toHaveLength(3);
    });

    it('should handle errors', async () => {
      const address = 'rTest123';
      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        service.getMoneyFlowsFromRedis(address, 5, 0),
      ).rejects.toThrow('Redis error');
    });
  });

  describe('getTokenHistoryFromRedis', () => {
    const mockMoneyFlow: MoneyFlowRow = {
      from_address: 'rTest1',
      to_address: 'rTest2',
      from_asset: 'XRP',
      to_asset: 'USD.rTest',
      from_amount: '100',
      to_amount: '50',
      init_from_amount: '100',
      init_to_amount: '50',
      price_usd: '1.0',
      kind: 'transfer',
      close_time: '2024-01-01 00:00:00.000',
      ledger_index: 123456,
      in_ledger_index: 0,
      tx_hash: 'test_hash',
    };

    it('should get token history from Redis', async () => {
      const asset = 'USD.rTest';
      const limit = 2;
      const offset = 0;

      redisService.getAsJson
        .mockResolvedValueOnce(3) // maxIndex
        .mockResolvedValueOnce(mockMoneyFlow) // mf:1
        .mockResolvedValueOnce(mockMoneyFlow); // mf:2

      const result = await service.getTokenHistoryFromRedis(
        asset,
        limit,
        offset,
      );

      expect(redisService.getAsJson).toHaveBeenCalledWith(
        `token-history:${asset}:mf:length`,
      );
      expect(result).toHaveLength(2);
    });

    it('should handle errors', async () => {
      const asset = 'USD.rTest';
      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        service.getTokenHistoryFromRedis(asset, 5, 0),
      ).rejects.toThrow('Redis error');
    });
  });

  describe('getTokenSummary', () => {
    const mockTokenSummary: TokenSummary = {
      holders: [],
      traders: 100,
      sellers: 50,
      buyers: 60,
      exchanges: 1000,
      avgBalance: 1000,
      volume: {
        buyVolume: 50000,
        saleVolume: 45000,
        totalVolume: 95000,
      },
      avgVolume: 950,
      richList: [],
      volumeRichList: [],
    };

    it('should get token summary from Redis', async () => {
      const asset = 'USD.rTest';

      redisService.getAsJson.mockResolvedValueOnce(mockTokenSummary);

      const result = await service.getTokenSummary(asset);

      expect(redisService.getAsJson).toHaveBeenCalledWith(`token:${asset}`);
      expect(result).toEqual(mockTokenSummary);
    });

    it('should return null when token summary is not found', async () => {
      const asset = 'USD.rTest';

      redisService.getAsJson.mockResolvedValueOnce(null);

      const result = await service.getTokenSummary(asset);

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      const asset = 'USD.rTest';
      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.getTokenSummary(asset)).rejects.toThrow(
        'Redis error',
      );
    });
  });

  describe('getAllTokens', () => {
    it('should get all tokens from ClickHouse', async () => {
      const mockTokens = ['USD.rTest', 'EUR.rTest', 'XRP.XRP'];
      clickhouseService.getAllTokens.mockResolvedValueOnce(mockTokens);

      const result = await service.getAllTokens();

      expect(clickhouseService.getAllTokens).toHaveBeenCalled();
      expect(result).toEqual(mockTokens);
    });

    it('should handle errors', async () => {
      clickhouseService.getAllTokens.mockRejectedValueOnce(
        new Error('ClickHouse error'),
      );

      await expect(service.getAllTokens()).rejects.toThrow('ClickHouse error');
    });
  });

  describe('getTopVolumeTokens', () => {
    const mockTopToken: TopTokenData = {
      top: 1,
      token: 'USD.rTest',
      holders: [],
      traders: 100,
      sellers: 50,
      buyers: 60,
      exchanges: 1000,
      avgBalance: 1000,
      volume: {
        buyVolume: 50000,
        saleVolume: 45000,
        totalVolume: 95000,
      },
      avgVolume: 950,
      richList: [],
      volumeRichList: [],
    };

    it('should get top volume tokens from Redis', async () => {
      redisService.getAsJson
        .mockResolvedValueOnce(mockTopToken) // top-token-last-day:1
        .mockResolvedValueOnce(null) // top-token-last-day:2
        .mockResolvedValueOnce({
          ...mockTopToken,
          top: 3,
        }); // top-token-last-day:3

      const result = await service.getTopVolumeTokens();

      expect(redisService.getAsJson).toHaveBeenCalledTimes(100);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.top).toBeLessThanOrEqual(result[1]?.top || 0);
    });

    it('should sort tokens by top number', async () => {
      redisService.getAsJson
        .mockResolvedValueOnce({ ...mockTopToken, top: 3 })
        .mockResolvedValueOnce({ ...mockTopToken, top: 1 })
        .mockResolvedValueOnce({ ...mockTopToken, top: 2 })
        .mockResolvedValue(null); // остальные null

      const result = await service.getTopVolumeTokens();

      expect(result[0]?.top).toBe(1);
      expect(result[1]?.top).toBe(2);
      expect(result[2]?.top).toBe(3);
    });

    it('should handle errors', async () => {
      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.getTopVolumeTokens()).rejects.toThrow('Redis error');
    });
  });

  describe('getChartsByToken', () => {
    const mockChartData: VolumeChartPoint[] = [
      { timestamp: 1234567890, value: 1000 },
      { timestamp: 1234567900, value: 2000 },
    ];

    it('should get all chart data for a token', async () => {
      const token = 'USD.rTest';

      redisService.getAsJson.mockResolvedValue(mockChartData);

      const result: TokenChartsResponse = await service.getChartsByToken(token);

      expect(redisService.getAsJson).toHaveBeenCalledTimes(12);
      expect(result.volume.oneHour).toEqual(mockChartData);
      expect(result.volume.oneDay).toEqual(mockChartData);
      expect(result.volume.sevenDay).toEqual(mockChartData);
      expect(result.volume.thirtyDay).toEqual(mockChartData);
      expect(result.holders.oneHour).toEqual(mockChartData);
      expect(result.holders.oneDay).toEqual(mockChartData);
      expect(result.holders.sevenDay).toEqual(mockChartData);
      expect(result.holders.thirtyDay).toEqual(mockChartData);
      expect(result.traders.oneHour).toEqual(mockChartData);
      expect(result.traders.oneDay).toEqual(mockChartData);
      expect(result.traders.sevenDay).toEqual(mockChartData);
      expect(result.traders.thirtyDay).toEqual(mockChartData);
    });

    it('should handle null values', async () => {
      const token = 'USD.rTest';

      redisService.getAsJson.mockResolvedValue(null);

      const result: TokenChartsResponse = await service.getChartsByToken(token);

      expect(result.volume.oneHour).toBeNull();
      expect(result.volume.oneDay).toBeNull();
    });

    it('should handle errors', async () => {
      const token = 'USD.rTest';
      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.getChartsByToken(token)).rejects.toThrow(
        'Redis error',
      );
    });
  });

  describe('getTopPNLAccounts', () => {
    const mockSaleData: SaleData = {
      qty: 100,
      fromAmount: 50,
      toAmount: 60,
      fromAmountUsd: 50,
      toAmountUsd: 60,
      pnl: 10,
      pnlUsd: 10,
      roi: 20,
      chain: [],
    };

    const mockAccount: SmartMoneySummary = {
      address: 'rTest123',
      totalPnl: 1000,
      totalPnlUsd: 1000,
      avgPnl: 100,
      avgPnlUsd: 100,
      avgBuy: 0.5,
      avgBuyUsd: 0.5,
      avgSale: 0.6,
      avgSaleUsd: 0.6,
      avgRoi: 20,
      positiveCount: 8,
      negativeCount: 2,
      totalCount: 10,
      winrate: 80,
      buyVolume: 5000,
      buyVolumeUsd: 5000,
      saleVolume: 6000,
      saleVolumeUsd: 6000,
      totalVolume: 11000,
      totalVolumeUsd: 11000,
      tags: [],
      balances: {},
      sales: [],
      minPNL: mockSaleData,
      maxPNL: mockSaleData,
      volumes: {},
      saleVolumes: {},
    };

    it('should get top PNL accounts from Redis', async () => {
      redisService.getAsJson
        .mockResolvedValueOnce({ ...mockAccount, totalPnl: 3000 }) // top:0
        .mockResolvedValueOnce({ ...mockAccount, totalPnl: 1000 }) // top:1
        .mockResolvedValueOnce({ ...mockAccount, totalPnl: 2000 }) // top:2
        .mockResolvedValue(null); // остальные null

      const result = await service.getTopPNLAccounts();

      expect(redisService.getAsJson).toHaveBeenCalledTimes(101);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.totalPnl).toBeGreaterThanOrEqual(
        result[1]?.totalPnl || 0,
      );
    });

    it('should sort accounts by totalPnl descending', async () => {
      redisService.getAsJson
        .mockResolvedValueOnce({ ...mockAccount, totalPnl: 1000 }) // top:0
        .mockResolvedValueOnce({ ...mockAccount, totalPnl: 3000 }) // top:1
        .mockResolvedValueOnce({ ...mockAccount, totalPnl: 2000 }) // top:2
        .mockResolvedValue(null); // остальные null

      const result = await service.getTopPNLAccounts();

      expect(result[0]?.totalPnl).toBe(3000);
      expect(result[1]?.totalPnl).toBe(2000);
      expect(result[2]?.totalPnl).toBe(1000);
    });

    it('should handle errors', async () => {
      redisService.getAsJson.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.getTopPNLAccounts()).rejects.toThrow('Redis error');
    });
  });
});
