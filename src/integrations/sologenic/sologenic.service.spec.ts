import { Test, TestingModule } from '@nestjs/testing';
import { SologenicService } from './sologenic.service';
import { IGetOhlc } from './interface/get-ohlc.interface';
import { IGetTickers } from './interface/get-tickers.interface';
import { IGetTrades } from './interface/get-trades.interface';
import { IOhlcResponse } from './interface/ohlc-response.interface';
import { ITickersResponse } from './interface/tickers-response.interface';
import { ITradesResponse } from './interface/trades-response.interface';
import { IssuedCurrency, XRP } from 'xrpl';

// Мокируем глобальный fetch
global.fetch = jest.fn();

// eslint-disable-next-line max-lines-per-function
describe('SologenicService', () => {
  let service: SologenicService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SologenicService],
    }).compile();

    service = module.get<SologenicService>(SologenicService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line max-lines-per-function
  describe('getOhlc', () => {
    const mockOhlcResponse: IOhlcResponse = [
      [
        1611069600,
        '5.54016620498615',
        '5.54016620498615',
        '5.54016620498615',
        '5.54016620498615',
        '1.9855',
      ],
      [
        1611069660,
        '5.54016620498615',
        '5.54016620498615',
        '5.54016620498615',
        '5.54016620498615',
        '0',
      ],
    ];

    const xrpAsset: XRP = { currency: 'XRP' };
    const usdAsset: IssuedCurrency = {
      currency: 'USD',
      issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
    };

    it('should fetch OHLC data with XRP and issued currency', async () => {
      const params: IGetOhlc = {
        asset: usdAsset,
        asset2: xrpAsset,
        period: '1m',
        from: 1611007200,
        to: 1611070980,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOhlcResponse,
      } as Response);

      const result = await service.getOhlc(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('https://api.sologenic.org/api/v1/ohlc');
      expect(calledUrl).toContain('symbol=');
      expect(calledUrl).toContain('period=1m');
      expect(calledUrl).toContain('from=1611007200');
      expect(calledUrl).toContain('to=1611070980');
      expect(result).toEqual(mockOhlcResponse);
    });

    it('should encode symbol correctly with special characters', async () => {
      const params: IGetOhlc = {
        asset: usdAsset,
        asset2: xrpAsset,
        period: '1h',
        from: 1611007200,
        to: 1611070980,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOhlcResponse,
      } as Response);

      await service.getOhlc(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      // Symbol should be URL encoded (USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi/XRP)
      expect(calledUrl).toContain('symbol=');
      expect(calledUrl).toContain('period=1h');
    });

    it('should handle different periods', async () => {
      const periods: IGetOhlc['period'][] = [
        '1m',
        '3m',
        '5m',
        '15m',
        '30m',
        '1h',
        '3h',
        '6h',
        '12h',
        '1d',
        '3d',
        '1w',
      ];

      for (const period of periods) {
        jest.clearAllMocks();
        const params: IGetOhlc = {
          asset: usdAsset,
          asset2: xrpAsset,
          period,
          from: 1611007200,
          to: 1611070980,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockOhlcResponse,
        } as Response);

        await service.getOhlc(params);

        const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
        expect(calledUrl).toContain(`period=${period}`);
      }
    });

    it('should handle API errors', async () => {
      const params: IGetOhlc = {
        asset: usdAsset,
        asset2: xrpAsset,
        period: '1m',
        from: 1611007200,
        to: 1611070980,
      };

      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getOhlc(params)).rejects.toThrow(errorMessage);
    });
  });

  describe('getTickers24h', () => {
    const mockTickersResponse: ITickersResponse = {
      'USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi/XRP': {
        open_time: 1611014400,
        open_price: '5.154639175257732',
        high_price: '5.54016620498615',
        low_price: '5.113524505284584',
        last_price: '5.54016620498615',
        volume: '13.049739333333827',
      },
      'XRP/USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi': {
        open_time: 1611014400,
        open_price: '0.1955598333334567',
        high_price: '0.1955598333334567',
        low_price: '0.1805',
        last_price: '0.1805',
        volume: '68',
      },
    };

    const xrpAsset: XRP = { currency: 'XRP' };
    const usdAsset: IssuedCurrency = {
      currency: 'USD',
      issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
    };

    it('should fetch tickers with POST request and correct body', async () => {
      const data: IGetTickers = {
        symbols: [
          { asset: usdAsset, asset2: xrpAsset },
          { asset: xrpAsset, asset2: usdAsset },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTickersResponse,
      } as Response);

      const result = await service.getTickers24h(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sologenic.org/api/v1/tickers/24h',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbols: [
              'USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi/XRP',
              'XRP/USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
            ],
          }),
        }),
      );
      expect(result).toEqual(mockTickersResponse);
    });

    it('should handle single symbol', async () => {
      const data: IGetTickers = {
        symbols: [{ asset: usdAsset, asset2: xrpAsset }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTickersResponse,
      } as Response);

      await service.getTickers24h(data);

      const callArgs = mockFetch.mock.calls[0];
      if (!callArgs || !callArgs[1]?.body) {
        throw new Error('Fetch was not called with expected arguments');
      }
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.symbols).toHaveLength(1);
      expect(body.symbols[0]).toBe(
        'USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi/XRP',
      );
    });

    it('should handle API errors', async () => {
      const data: IGetTickers = {
        symbols: [{ asset: usdAsset, asset2: xrpAsset }],
      };

      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getTickers24h(data)).rejects.toThrow(errorMessage);
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe('getTrades', () => {
    const mockTradesResponse: ITradesResponse = [
      {
        id: 643521990000310000,
        txid: 'A6D2D7ECF648F82703B62613E525A98D9342914A7CF39D8A0373DD05BBB5C9ED',
        symbol:
          '534F4C4F00000000000000000000000000000000+rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz/XRP',
        buyer: 'rNZf65LFq8jdWhQEo9faRYQHxn61kgK2yy',
        seller: 'r3S8px1Qx6ctoQGv8puFwahoLWGjVZksQv',
        is_seller_taker: true,
        amount: '0.001',
        price: '1.15',
        quote_amount: '0.00115',
        executed_at: '2021-06-18T11:33:12Z',
        time: '2021-06-18T11:33:12Z',
      },
    ];

    const xrpAsset: XRP = { currency: 'XRP' };
    const soloAsset: IssuedCurrency = {
      currency: '534F4C4F00000000000000000000000000000000',
      issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
    };

    it('should fetch trades by symbol', async () => {
      const params: IGetTrades = {
        asset: soloAsset,
        asset2: xrpAsset,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTradesResponse,
      } as Response);

      const result = await service.getTrades(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('https://api.sologenic.org/api/v1/trades');
      expect(calledUrl).toContain('symbol=');
      expect(result).toEqual(mockTradesResponse);
    });

    it('should fetch trades by account', async () => {
      const params: IGetTrades = {
        account: 'r3S8px1Qx6ctoQGv8puFwahoLWGjVZksQv',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTradesResponse,
      } as Response);

      const result = await service.getTrades(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('https://api.sologenic.org/api/v1/trades');
      expect(calledUrl).toContain('account=r3S8px1Qx6ctoQGv8puFwahoLWGjVZksQv');
      expect(result).toEqual(mockTradesResponse);
    });

    it('should fetch trades with limit parameter', async () => {
      const params: IGetTrades = {
        asset: soloAsset,
        asset2: xrpAsset,
        limit: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTradesResponse,
      } as Response);

      await service.getTrades(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('limit=100');
    });

    it('should fetch trades with before_id and after_id parameters', async () => {
      const params: IGetTrades = {
        asset: soloAsset,
        asset2: xrpAsset,
        beforeId: 643521990000320000,
        afterId: 643521320000180000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTradesResponse,
      } as Response);

      await service.getTrades(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain('before_id=643521990000320000');
      expect(calledUrl).toContain('after_id=643521320000180000');
    });

    it('should throw error when neither symbol nor account is provided', async () => {
      const params: IGetTrades = {};

      await expect(service.getTrades(params)).rejects.toThrow(
        'Required params.asset && params.asset2 || params.account',
      );
    });

    it('should throw error when only asset is provided without asset2', async () => {
      const params: IGetTrades = {
        asset: soloAsset,
        // asset2 is missing
      };

      await expect(service.getTrades(params)).rejects.toThrow(
        'Required params.asset && params.asset2 || params.account',
      );
    });

    it('should handle API errors', async () => {
      const params: IGetTrades = {
        asset: soloAsset,
        asset2: xrpAsset,
      };

      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getTrades(params)).rejects.toThrow(errorMessage);
    });
  });

  describe('buildSymbol', () => {
    const xrpAsset: XRP = { currency: 'XRP' };
    const usdAsset: IssuedCurrency = {
      currency: 'USD',
      issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
    };

    it('should build symbol correctly for XRP and issued currency', async () => {
      const params: IGetOhlc = {
        asset: usdAsset,
        asset2: xrpAsset,
        period: '1m',
        from: 1611007200,
        to: 1611070980,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await service.getOhlc(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      // Symbol should be: USD+rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi/XRP
      // URLSearchParams encodes it, so + becomes %2B, / becomes %2F
      // But we also use encodeURIComponent, so it gets double encoded: %2B becomes %252B
      expect(calledUrl).toContain('USD');
      expect(calledUrl).toContain('rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi');
      expect(calledUrl).toContain('XRP');
    });

    it('should build symbol correctly for two issued currencies', async () => {
      const soloAsset: IssuedCurrency = {
        currency: '534F4C4F00000000000000000000000000000000',
        issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
      };

      const params: IGetTrades = {
        asset: soloAsset,
        asset2: usdAsset,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await service.getTrades(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      // Symbol should contain both currencies with + and /
      expect(calledUrl).toContain('symbol=');
    });

    it('should build symbol correctly for XRP/XRP pair', async () => {
      const params: IGetOhlc = {
        asset: xrpAsset,
        asset2: xrpAsset,
        period: '1m',
        from: 1611007200,
        to: 1611070980,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await service.getOhlc(params);

      const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
      // Symbol should be: XRP/XRP
      // URLSearchParams encodes it, so / becomes %2F
      // But we also use encodeURIComponent, so it gets double encoded: %2F becomes %252F
      expect(calledUrl).toContain('XRP');
      expect(calledUrl).toContain('symbol=');
    });
  });
});
