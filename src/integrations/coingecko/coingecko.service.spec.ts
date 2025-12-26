import { Test, TestingModule } from '@nestjs/testing';
import { CoingeckoService } from './coingecko.service';
import { ECurrency } from './enum/currency.enum';
import { IGetPrice } from './interface/get-price.interface';
import { IPriceResponse } from './interface/price-response.interface';

// Мокируем глобальный fetch
global.fetch = jest.fn();

// eslint-disable-next-line max-lines-per-function
describe('CoingeckoService', () => {
  let service: CoingeckoService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoingeckoService],
    }).compile();

    service = module.get<CoingeckoService>(CoingeckoService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line max-lines-per-function
  describe('getPrice', () => {
    const mockPriceResponse: IPriceResponse = {
      ripple: {
        usd: 0.5,
        eur: 0.45,
        rub: 50.0,
      },
    };

    it('should get price with required parameters only', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD, ECurrency.EUR],
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      const result = await service.getPrice(data);

      expect(result).toEqual(mockPriceResponse);
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('ids=ripple');
      expect(url).toContain('vs_currencies=usd');
      expect(url).toContain('vs_currencies');
      expect(url).toContain('eur');
    });

    it('should get price with multiple ids', async () => {
      const data: IGetPrice = {
        ids: ['ripple', 'bitcoin'],
        vs_currencies: [ECurrency.USD],
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('ids=ripple');
      expect(url).toContain('bitcoin');
      expect(url).toContain('vs_currencies=usd');
    });

    it('should include market cap when requested', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        include_market_cap: true,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_market_cap=true',
      );
    });

    it('should include 24hr volume when requested', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        include_24hr_vol: true,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_vol=true',
      );
    });

    it('should include 24hr change when requested', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        include_24hr_change: true,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true',
      );
    });

    it('should include last updated at when requested', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        include_last_updated_at: true,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_last_updated_at=true',
      );
    });

    it('should include precision when requested as number', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        precision: 2,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&precision=2',
      );
    });

    it('should include precision when requested as "full"', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        precision: 'full',
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&precision=full',
      );
    });

    it('should include all optional parameters', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD, ECurrency.EUR],
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
        include_last_updated_at: true,
        precision: 4,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toBeDefined();
      expect(url).toContain('ids=ripple');
      expect(url).toContain('vs_currencies');
      expect(url).toContain('usd');
      expect(url).toContain('eur');
      expect(url).toContain('include_market_cap=true');
      expect(url).toContain('include_24hr_vol=true');
      expect(url).toContain('include_24hr_change=true');
      expect(url).toContain('include_last_updated_at=true');
      expect(url).toContain('precision=4');
    });

    it('should handle false boolean values', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
        include_market_cap: false,
        include_24hr_vol: false,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false',
      );
    });

    it('should handle API errors', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getPrice(data)).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response);

      await expect(service.getPrice(data)).rejects.toThrow('Invalid JSON');
    });

    it('should handle multiple vs_currencies', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [
          ECurrency.USD,
          ECurrency.EUR,
          ECurrency.RUB,
          ECurrency.JPY,
        ],
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockPriceResponse),
      } as unknown as Response);

      await service.getPrice(data);

      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('ids=ripple');
      expect(url).toContain('vs_currencies');
      expect(url).toContain('usd');
      expect(url).toContain('eur');
      expect(url).toContain('rub');
      expect(url).toContain('jpy');
    });

    it('should return correct response type', async () => {
      const data: IGetPrice = {
        ids: 'ripple',
        vs_currencies: [ECurrency.USD],
      };

      const responseWithMarketCap: IPriceResponse = {
        ripple: {
          usd: 0.5,
          usd_market_cap: 25000000000,
          usd_24h_vol: 1000000000,
          usd_24h_change: 2.5,
          last_updated_at: 1234567890,
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(responseWithMarketCap),
      } as unknown as Response);

      const result = await service.getPrice(data);

      expect(result).toEqual(responseWithMarketCap);
      expect(result.ripple).toBeDefined();
      expect(result.ripple?.usd).toBe(0.5);
      expect(result.ripple?.usd_market_cap).toBe(25000000000);
    });
  });
});
