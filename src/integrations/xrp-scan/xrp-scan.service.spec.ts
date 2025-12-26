import { Test, TestingModule } from '@nestjs/testing';
import { XrpScanService } from './xrp-scan.service';
import { IGetAmmPools } from './interface/get-amm-pulls.interface';
import { IGetToken } from './interface/get-token.interface';
import { IAmmPool } from './interface/amm-pool.interface';
import { IAmmInfo } from './interface/amm-info.interface';
import { ITokenInfo } from './interface/token-info.interface';

// Мокируем глобальный fetch
global.fetch = jest.fn();

// eslint-disable-next-line max-lines-per-function
describe('XrpScanService', () => {
  let service: XrpScanService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XrpScanService],
    }).compile();

    service = module.get<XrpScanService>(XrpScanService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAmmPools', () => {
    const mockAmmPoolsResponse: IAmmPool[] = [
      {
        Account: 'rdrBYMcjBo9zVExL7V3DicH48FXgKW5RX',
        Asset: {
          currency: 'XRP',
        },
        Asset2: {
          currency: '5852505300000000000000000000000000000000',
          issuer: 'rN1bCPAxHDvyJzvkUso1L2wvXufgE4gXPL',
        },
        TradingFee: 300,
        index:
          '4147EE9748EC1E13566D445E1B9DB77540E34CA604423C12B1ADCF693C92B307',
        Balance: 49149000774,
      },
    ];

    it('should fetch AMM pools without query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAmmPoolsResponse,
      } as Response);

      const result = await service.getAmmPools();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.xrpscan.com/api/v1/amm/pools',
      );
      expect(result).toEqual(mockAmmPoolsResponse);
    });

    it('should fetch AMM pools with limit parameter', async () => {
      const queryData: IGetAmmPools = {
        limit: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAmmPoolsResponse,
      } as Response);

      const result = await service.getAmmPools(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.xrpscan.com/api/v1/amm/pools?limit=10',
      );
      expect(result).toEqual(mockAmmPoolsResponse);
    });

    it('should fetch AMM pools with offset parameter', async () => {
      const queryData: IGetAmmPools = {
        offset: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAmmPoolsResponse,
      } as Response);

      const result = await service.getAmmPools(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.xrpscan.com/api/v1/amm/pools?offset=20',
      );
      expect(result).toEqual(mockAmmPoolsResponse);
    });

    it('should fetch AMM pools with both limit and offset parameters', async () => {
      const queryData: IGetAmmPools = {
        limit: 10,
        offset: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAmmPoolsResponse,
      } as Response);

      const result = await service.getAmmPools(queryData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.xrpscan.com/api/v1/amm/pools?limit=10&offset=20',
      );
      expect(result).toEqual(mockAmmPoolsResponse);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getAmmPools()).rejects.toThrow(errorMessage);
    });
  });

  describe('getAmmPoolByAccount', () => {
    const mockAmmInfoResponse: IAmmInfo = {
      account: 'rs9ineLqrCzeAGS1bxsrW8x2n3bRJYAh3Q',
      amount: '14679296731',
      amount2: {
        currency: 'USD',
        issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
        value: '9043.349269355098',
      },
      asset2_frozen: false,
      lp_token: {
        currency: '03930D02208264E2E40EC1B0C09E4DB96EE197B1',
        issuer: 'rs9ineLqrCzeAGS1bxsrW8x2n3bRJYAh3Q',
        value: '11108703.80455174',
      },
      trading_fee: 290,
      vote_slots: [
        {
          account: 'rBLPZR37M5rhKMLyeNqJZEHEivJob6ptFm',
          trading_fee: 1000,
          vote_weight: 5181,
        },
      ],
    };

    it('should fetch AMM info by account', async () => {
      const account = 'rs9ineLqrCzeAGS1bxsrW8x2n3bRJYAh3Q';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAmmInfoResponse,
      } as Response);

      const result = await service.getAmmPoolByAccount(account);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.xrpscan.com/api/v1/amm/${account}`,
      );
      expect(result).toEqual(mockAmmInfoResponse);
    });

    it('should handle API errors', async () => {
      const account = 'rs9ineLqrCzeAGS1bxsrW8x2n3bRJYAh3Q';
      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getAmmPoolByAccount(account)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('getTokenByAssetAndIssuer', () => {
    const mockTokenInfoResponse: ITokenInfo = {
      id: '524C555344000000000000000000000000000000.rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      amms: 171,
      code: 'RLUSD',
      createdAt: '2025-01-09T10:29:28.080Z',
      currency: '524C555344000000000000000000000000000000',
      holders: 33491,
      issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      token: 'RLUSD.rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      updatedAt: '2025-07-03T18:47:21.597Z',
      blackholed: false,
      marketcap: 28970634.053129405,
      price: 0.4395789888276604,
      supply: 65905411.2900003,
      metrics: {
        trustlines: 61019,
        holders: 33427,
        supply: '65905411.2900162',
        marketcap: '30180789.9515613',
        price: '0.457941',
        volume_24h: '1130734.21792498',
        volume_7d: '5623264.31269795',
        exchanges_24h: 7423,
        exchanges_7d: 44699,
        takers_24h: 337,
        takers_7d: 1195,
      },
      disabled: false,
      score: 0.4085713679973927,
    };

    it('should fetch token info by asset and issuer', async () => {
      const tokenData: IGetToken = {
        asset: 'RLUSD',
        issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenInfoResponse,
      } as Response);

      const result = await service.getTokenByAssetAndIssuer(tokenData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.xrpscan.com/api/v1/token/RLUSD.rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      );
      expect(result).toEqual(mockTokenInfoResponse);
    });

    it('should handle API errors', async () => {
      const tokenData: IGetToken = {
        asset: 'RLUSD',
        issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      };

      const errorMessage = 'API Error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getTokenByAssetAndIssuer(tokenData)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
