import { Test, TestingModule } from '@nestjs/testing';
import { NewTokenService } from './new-token.service';
import { InternalRedisAdapter } from '../../common/redis/internal-redis.adapter';
import { NewTokenList } from './interface/new-token.interface';

describe('NewTokenService', () => {
  let service: NewTokenService;
  let redisService: jest.Mocked<InternalRedisAdapter>;

  beforeEach(async () => {
    const mockRedisService = {
      setAsJsonEx: jest.fn().mockResolvedValue(undefined),
      getAsJson: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewTokenService,
        {
          provide: InternalRedisAdapter,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<NewTokenService>(NewTokenService);
    redisService = module.get(InternalRedisAdapter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveNewTokens', () => {
    it('should save new tokens to Redis with correct key and expiration', async () => {
      const newTokens: NewTokenList = [
        {
          currency: 'USD',
          issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
          first_seen_ledger_index: 123456,
        },
        {
          currency: 'EUR',
          issuer: 'rN1bCPAxHDvyJzvkUso1L2wvXufgE4gXPL',
          first_seen_ledger_index: 123457,
        },
      ];

      await service.saveNewTokens(newTokens);

      expect(redisService.setAsJsonEx).toHaveBeenCalledWith(
        'new-tokens:list',
        newTokens,
        120,
      );
      expect(redisService.setAsJsonEx).toHaveBeenCalledTimes(1);
    });

    it('should handle empty array', async () => {
      const newTokens: NewTokenList = [];

      await service.saveNewTokens(newTokens);

      expect(redisService.setAsJsonEx).toHaveBeenCalledWith(
        'new-tokens:list',
        [],
        120,
      );
    });

    it('should handle errors from Redis', async () => {
      const newTokens: NewTokenList = [{ currency: 'USD', issuer: 'rTest' }];
      const error = new Error('Redis connection failed');
      redisService.setAsJsonEx.mockRejectedValueOnce(error);

      await expect(service.saveNewTokens(newTokens)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('getNewTokens', () => {
    it('should get new tokens from Redis', async () => {
      const mockTokens: NewTokenList = [
        {
          currency: 'USD',
          issuer: 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi',
          first_seen_ledger_index: 123456,
        },
        {
          currency: 'EUR',
          issuer: 'rN1bCPAxHDvyJzvkUso1L2wvXufgE4gXPL',
          first_seen_ledger_index: 123457,
        },
      ];

      redisService.getAsJson.mockResolvedValueOnce(mockTokens);

      const result = await service.getNewTokens();

      expect(redisService.getAsJson).toHaveBeenCalledWith('new-tokens:list');
      expect(result).toEqual(mockTokens);
    });

    it('should return null when no tokens are found', async () => {
      redisService.getAsJson.mockResolvedValueOnce(null);

      const result = await service.getNewTokens();

      expect(redisService.getAsJson).toHaveBeenCalledWith('new-tokens:list');
      expect(result).toBeNull();
    });

    it('should handle errors from Redis', async () => {
      const error = new Error('Redis connection failed');
      redisService.getAsJson.mockRejectedValueOnce(error);

      await expect(service.getNewTokens()).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });
});
