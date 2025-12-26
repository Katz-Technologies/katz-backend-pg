import { Test, TestingModule } from '@nestjs/testing';
import { GeckoTerminalService } from './gecko-terminal.service';
import { IssuedCurrency } from 'xrpl';
import { OhlcvDataPoint } from './interface/ohlcv-data-point.type';
import { GeckoTerminalResponse } from './interface/gecko-terminal-response.interface';

// Мокируем глобальный fetch
global.fetch = jest.fn();

// eslint-disable-next-line max-lines-per-function
describe('GeckoTerminalService', () => {
  let service: GeckoTerminalService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeckoTerminalService],
    }).compile();

    service = module.get<GeckoTerminalService>(GeckoTerminalService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line max-lines-per-function
  describe('getLast24hVolume', () => {
    const mockAsset: IssuedCurrency = {
      currency: 'USD',
      issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
    };

    const createMockResponse = (
      ohlcvList: OhlcvDataPoint[],
    ): GeckoTerminalResponse => ({
      data: {
        attributes: {
          ohlcv_list: ohlcvList,
        },
      },
    });

    it('should calculate volume from first and second batch', async () => {
      const firstBatch: OhlcvDataPoint[] = [
        [1712534400, 3454.61, 3660.86, 3417.92, 3660.86, 1000], // volume = 1000
        [1712534460, 3660.86, 3700.0, 3650.0, 3680.0, 2000], // volume = 2000
        [1712534520, 3680.0, 3750.0, 3670.0, 3740.0, 1500], // volume = 1500, last item
      ];

      const secondBatch: OhlcvDataPoint[] = [
        [1712534580, 3740.0, 3800.0, 3730.0, 3780.0, 3000], // volume = 3000
        [1712534640, 3780.0, 3850.0, 3770.0, 3820.0, 2500], // volume = 2500
      ];

      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(firstBatch)),
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(secondBatch)),
        } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      expect(result).toBe(10000); // 1000 + 2000 + 1500 + 3000 + 2500
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.geckoterminal.com/api/v2/networks/xrpl/pools/USD.rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi_XRP/ohlcv/minute?aggregate=1&limit=1000&currency=token&include_empty_intervals=true',
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.geckoterminal.com/api/v2/networks/xrpl/pools/USD.rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi_XRP/ohlcv/minute?aggregate=1&limit=440&currency=token&include_empty_intervals=true&before_timestamp=1712534520',
      );
    });

    it('should return 0 when first batch is empty', async () => {
      const emptyBatch: OhlcvDataPoint[] = [];

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(createMockResponse(emptyBatch)),
      } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      expect(result).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when first batch is null', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest
          .fn()
          .mockResolvedValue(
            createMockResponse(null as unknown as OhlcvDataPoint[]),
          ),
      } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      expect(result).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle case when lastItem is undefined', async () => {
      const firstBatch: OhlcvDataPoint[] = [
        [1712534400, 3454.61, 3660.86, 3417.92, 3660.86, 1000],
        [1712534460, 3660.86, 3700.0, 3650.0, 3680.0, 2000],
      ];

      const emptySecondBatch: OhlcvDataPoint[] = [];

      // В реальности lastItem всегда будет существовать, если массив не пустой
      // Но тестируем, что код правильно обрабатывает второй запрос
      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(firstBatch)),
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: jest
            .fn()
            .mockResolvedValue(createMockResponse(emptySecondBatch)),
        } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      // Должен вернуть сумму объемов из первого батча
      expect(result).toBe(3000); // 1000 + 2000
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle single batch with one item', async () => {
      const singleItem: OhlcvDataPoint[] = [
        [1712534400, 3454.61, 3660.86, 3417.92, 3660.86, 5000],
      ];

      const emptySecondBatch: OhlcvDataPoint[] = [];

      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(singleItem)),
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: jest
            .fn()
            .mockResolvedValue(createMockResponse(emptySecondBatch)),
        } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      expect(result).toBe(5000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Второй вызов должен быть с before_timestamp из первого элемента
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.geckoterminal.com/api/v2/networks/xrpl/pools/USD.rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi_XRP/ohlcv/minute?aggregate=1&limit=440&currency=token&include_empty_intervals=true&before_timestamp=1712534400',
      );
    });

    it('should handle empty second batch', async () => {
      const firstBatch: OhlcvDataPoint[] = [
        [1712534400, 3454.61, 3660.86, 3417.92, 3660.86, 1000],
        [1712534460, 3660.86, 3700.0, 3650.0, 3680.0, 2000],
      ];

      const emptySecondBatch: OhlcvDataPoint[] = [];

      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(firstBatch)),
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: jest
            .fn()
            .mockResolvedValue(createMockResponse(emptySecondBatch)),
        } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      expect(result).toBe(3000); // только из первого батча
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getLast24hVolume(mockAsset)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response);

      await expect(service.getLast24hVolume(mockAsset)).rejects.toThrow(
        'Invalid JSON',
      );
    });

    it('should correctly build URL for different asset', async () => {
      const differentAsset: IssuedCurrency = {
        currency: 'EUR',
        issuer: 'rN1bCPAxHDvyJzvkUso1L2wvXufgE4gXPL',
      };

      const firstBatch: OhlcvDataPoint[] = [
        [1712534400, 3454.61, 3660.86, 3417.92, 3660.86, 1000],
      ];

      const emptySecondBatch: OhlcvDataPoint[] = [];

      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(firstBatch)),
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: jest
            .fn()
            .mockResolvedValue(createMockResponse(emptySecondBatch)),
        } as unknown as Response);

      await service.getLast24hVolume(differentAsset);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.geckoterminal.com/api/v2/networks/xrpl/pools/EUR.rN1bCPAxHDvyJzvkUso1L2wvXufgE4gXPL_XRP/ohlcv/minute?aggregate=1&limit=1000&currency=token&include_empty_intervals=true',
      );
    });

    it('should sum volumes correctly with zero volumes', async () => {
      const firstBatch: OhlcvDataPoint[] = [
        [1712534400, 3454.61, 3660.86, 3417.92, 3660.86, 0], // volume = 0
        [1712534460, 3660.86, 3700.0, 3650.0, 3680.0, 1000], // volume = 1000
        [1712534520, 3680.0, 3750.0, 3670.0, 3740.0, 0], // volume = 0
      ];

      const secondBatch: OhlcvDataPoint[] = [
        [1712534580, 3740.0, 3800.0, 3730.0, 3780.0, 0], // volume = 0
      ];

      mockFetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(firstBatch)),
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(createMockResponse(secondBatch)),
        } as unknown as Response);

      const result = await service.getLast24hVolume(mockAsset);

      expect(result).toBe(1000);
    });
  });
});
