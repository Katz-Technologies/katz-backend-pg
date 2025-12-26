import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
// Temporarily disabled - Redis and ClickHouse checks are commented out
// import { REDIS_TOKENS } from '../../common/redis/redis.tokens';
// import type { RedisService } from '../../common/redis/redis.service';

// jest.mock('../../common/clickhouse/clickhouse.service', () => {
//   return {
//     ClickhouseService: jest.fn().mockImplementation(() => ({
//       executeQuery: jest.fn().mockResolvedValue([{ '1': 1 }]),
//     })),
//   };
// });

// import { ClickhouseService } from '../../common/clickhouse/clickhouse.service';

describe('HealthController', () => {
  let controller: HealthController;
  // Temporarily disabled - Redis and ClickHouse checks are commented out
  // let redisService: jest.Mocked<RedisService>;
  // let clickhouseService: jest.Mocked<ClickhouseService>;

  beforeEach(async () => {
    // Temporarily disabled - Redis and ClickHouse checks are commented out
    // const mockRedisService = {
    //   isReady: jest.fn().mockReturnValue(true),
    //   ensureReady: jest.fn().mockResolvedValue(undefined),
    //   get: jest.fn().mockResolvedValue(null),
    // };

    // const mockClickhouseService = {
    //   executeQuery: jest.fn().mockResolvedValue([{ '1': 1 }]),
    // };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        // Temporarily disabled - Redis and ClickHouse checks are commented out
        // {
        //   provide: REDIS_TOKENS.EXTERNAL,
        //   useValue: mockRedisService,
        // },
        // {
        //   provide: ClickhouseService,
        //   useValue: mockClickhouseService,
        // },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    // redisService = module.get(REDIS_TOKENS.EXTERNAL);
    // clickhouseService = module.get(ClickhouseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status when all services are healthy', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.services.redis.status).toBe('ok');
      expect(result.services.clickhouse.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.memory).toBeDefined();
    });

    // Temporarily disabled - Redis and ClickHouse checks are commented out
    // it('should return degraded status when Redis fails', async () => {
    //   redisService.get.mockRejectedValue(new Error('Redis connection failed'));

    //   const result = await controller.check();

    //   expect(result.status).toBe('degraded');
    //   expect(result.services.redis.status).toBe('error');
    //   expect(result.services.clickhouse.status).toBe('ok');
    // });

    // it('should return degraded status when ClickHouse fails', async () => {
    //   clickhouseService.executeQuery.mockRejectedValue(
    //     new Error('ClickHouse connection failed'),
    //   );

    //   const result = await controller.check();

    //   expect(result.status).toBe('degraded');
    //   expect(result.services.redis.status).toBe('ok');
    //   expect(result.services.clickhouse.status).toBe('error');
    // });

    // it('should return down status when all services fail', async () => {
    //   redisService.get.mockRejectedValue(new Error('Redis connection failed'));
    //   clickhouseService.executeQuery.mockRejectedValue(
    //     new Error('ClickHouse connection failed'),
    //   );

    //   const result = await controller.check();

    //   expect(result.status).toBe('down');
    //   expect(result.services.redis.status).toBe('error');
    //   expect(result.services.clickhouse.status).toBe('error');
    // });

    it('should include memory usage information', async () => {
      const result = await controller.check();

      expect(result.memory).toBeDefined();
      expect(result.memory.used).toBeGreaterThan(0);
      expect(result.memory.total).toBeGreaterThan(0);
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.memory.percentage).toBeLessThanOrEqual(100);
    });
  });
});
