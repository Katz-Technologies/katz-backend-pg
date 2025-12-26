import { Test, TestingModule } from '@nestjs/testing';
import { XrplMetaService } from './xrpl-meta.service';
import { IGetTokens } from './interface/get-tokens.interface';
import { IGetToken } from './interface/get-token.interface';
import {
  IGetTokensResponse,
  IToken,
} from './interface/get-tokens-response.interface';
import { ETokensSort } from './enum/tokens-sort.enum';

// Мокируем глобальный fetch
global.fetch = jest.fn();

describe('XrplMetaService', () => {
  let service: XrplMetaService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XrplMetaService],
    }).compile();

    service = module.get<XrplMetaService>(XrplMetaService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokens', () => {
    const mockTokensResponse: IGetTokensResponse = {
      tokens: [
        {
          currency: 'USD',
          issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
          metrics: {
            trustlines: 1000,
            holders: 500,
            supply: '1000000',
            marketcap: '500000',
            price: '0.5',
            volume_24h: '10000',
            volume_7d: '70000',
            exchanges_24h: 100,
            exchanges_7d: 700,
            takers_24h: 50,
            takers_7d: 350,
          },
        },
      ],
      count: 1,
    };

    it('should fetch tokens without query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokensResponse,
      } as Response);

      const result = await service.getTokens();

      expect(mockFetch).toHaveBeenCalledWith('https://s1.xrplmeta.org/tokens');
      expect(result).toEqual(mockTokensResponse);
    });

    it('should fetch tokens with query parameters', async () => {
      const queryData: IGetTokens = {
        limit: 10,
        offset: 0,
        sort_by: ETokensSort.trustlines,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokensResponse,
      } as Response);

      const result = await service.getTokens(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/tokens?limit=10&offset=0&sort_by=trustlines',
      );
      expect(result).toEqual(mockTokensResponse);
    });

    it('should handle trust_level array parameter correctly', async () => {
      const queryData: IGetTokens = {
        trust_level: [0, 1, 2, 3],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokensResponse,
      } as Response);

      await service.getTokens(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/tokens?trust_level=0&trust_level=1&trust_level=2&trust_level=3',
      );
    });

    it('should handle array parameters correctly', async () => {
      const queryData: IGetTokens = {
        limit: 10,
        offset: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokensResponse,
      } as Response);

      await service.getTokens(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/tokens?limit=10&offset=0',
      );
    });

    it('should skip undefined and null values', async () => {
      const queryData: IGetTokens = {
        limit: 10,
        offset: undefined,
        sort_by: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokensResponse,
      } as Response);

      await service.getTokens(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/tokens?limit=10',
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getTokens()).rejects.toThrow(errorMessage);
    });
  });

  describe('getTokenByAssetAndIssuer', () => {
    const mockTokenResponse: IToken = {
      currency: 'USD',
      issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      metrics: {
        trustlines: 1000,
        holders: 500,
        supply: '1000000',
        marketcap: '500000',
        price: '0.5',
        volume_24h: '10000',
        volume_7d: '70000',
        exchanges_24h: 100,
        exchanges_7d: 700,
        takers_24h: 50,
        takers_7d: 350,
      },
    };

    it('should fetch token by asset and issuer without query parameters', async () => {
      const tokenData: IGetToken = {
        asset: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await service.getTokenByAssetAndIssuer(tokenData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/token/USD:rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      );
      expect(result).toEqual(mockTokenResponse);
    });

    it('should fetch token with include_sources parameter', async () => {
      const tokenData: IGetToken = {
        asset: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        include_sources: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await service.getTokenByAssetAndIssuer(tokenData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/token/USD:rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B?include_sources=true',
      );
    });

    it('should fetch token with include_changes parameter', async () => {
      const tokenData: IGetToken = {
        asset: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        include_changes: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await service.getTokenByAssetAndIssuer(tokenData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s1.xrplmeta.org/token/USD:rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B?include_changes=true',
      );
    });

    it('should fetch token with both query parameters', async () => {
      const tokenData: IGetToken = {
        asset: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        include_sources: true,
        include_changes: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await service.getTokenByAssetAndIssuer(tokenData);

      const calledUrl = (mockFetch.mock.calls[0]?.[0] as string) ?? '';
      const urlParts = calledUrl.split('?');
      const baseUrl = urlParts[0];
      const queryParams = urlParts[1] ?? '';
      expect(baseUrl).toBe(
        'https://s1.xrplmeta.org/token/USD:rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      );
      expect(queryParams).toContain('include_sources=true');
      expect(queryParams).toContain('include_changes=true');
    });

    it('should handle API errors', async () => {
      const tokenData: IGetToken = {
        asset: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      };

      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getTokenByAssetAndIssuer(tokenData)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
