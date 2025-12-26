import { Controller, Get } from '@nestjs/common';
// import { Inject } from '@nestjs/common';
// import { REDIS_TOKENS } from '../../common/redis/redis.tokens';
// import type { RedisService } from '../../common/redis/redis.service';
// import { ClickhouseService } from '../../common/clickhouse/clickhouse.service';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    redis: {
      status: 'ok' | 'error';
      message?: string;
    };
    clickhouse: {
      status: 'ok' | 'error';
      message?: string;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor() {}
  // @Inject(REDIS_TOKENS.EXTERNAL)
  // private readonly redisService: RedisService,
  // private readonly clickhouseService: ClickhouseService,

  @Get()
  async check(): Promise<HealthStatus> {
    const services = {
      redis: await this.checkRedis(),
      clickhouse: await this.checkClickHouse(),
    };

    const allServicesOk =
      services.redis.status === 'ok' && services.clickhouse.status === 'ok';

    const overallStatus = allServicesOk
      ? 'ok'
      : services.redis.status === 'error' &&
          services.clickhouse.status === 'error'
        ? 'down'
        : 'degraded';

    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage * 100) / 100,
      },
    };
  }

  private async checkRedis(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      // const isReady = this.redisService.isReady();
      // if (!isReady) {
      //   await this.redisService.ensureReady();
      // }

      // Простая проверка: пытаемся выполнить ping через get
      // await this.redisService.get('health-check');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  private async checkClickHouse(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      // Простая проверка: выполняем SELECT 1
      // await this.clickhouseService.executeQuery('SELECT 1');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Unknown ClickHouse error',
      };
    }
  }
}
