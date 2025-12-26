import { Injectable, Logger } from '@nestjs/common';
import { ClickhouseService } from '../../common/clickhouse/clickhouse.service';
import type { RedisService } from '../../common/redis/redis.service';
import { Inject } from '@nestjs/common';
import { REDIS_TOKENS } from '../../common/redis/redis.tokens';
import { TokenSummary } from './type/token-summary.type';
import { SmartMoneySummary } from './type/smart-money-summary.type';
import { SaleData } from './type/sale-data.type';
import { MoneyFlowRow } from './interface/money-flow-row.interface';

@Injectable()
export class SmartMoneyService {
  private readonly logger = new Logger(SmartMoneyService.name);

  constructor(
    private readonly clickhouseService: ClickhouseService,
    @Inject(REDIS_TOKENS.EXTERNAL)
    private readonly redisService: RedisService,
  ) {}

  async getSales(
    address: string,
    limit: number,
    offset: number = 0,
  ): Promise<SaleData[]> {
    try {
      const sales: SaleData[] = [];
      const maxIndex = await this.redisService.getAsJson<number>(
        `summary:${address}:sale:length`,
      );

      for (
        let index = offset + 1;
        index <= limit + offset && index <= maxIndex;
        index++
      ) {
        try {
          const sale = await this.redisService.getAsJson<SaleData>(
            `summary:${address}:sale:${index}`,
          );
          if (sale) {
            sales.push(sale);
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      return sales;
    } catch (error) {
      this.logger.error(`Failed to get sales for address ${address}:`, error);
      throw error;
    }
  }

  async getMoneyFlowsFromRedis(
    address: string,
    limit: number,
    offset: number = 0,
  ): Promise<MoneyFlowRow[]> {
    try {
      const addressHistory: MoneyFlowRow[] = [];
      const maxIndex = await this.redisService.getAsJson<number>(
        `history:${address}:mf:length`,
      );

      for (
        let index = offset + 1;
        index <= limit + offset && index <= maxIndex;
        index++
      ) {
        const element = await this.redisService.getAsJson<MoneyFlowRow>(
          `history:${address}:mf:${index}`,
        );

        addressHistory.push(element);
      }

      return addressHistory;
    } catch (error) {
      this.logger.error(
        `Failed to get money flows for address ${address}:`,
        error,
      );
      throw error;
    }
  }

  async getTokenHistoryFromRedis(
    asset: string,
    limit: number,
    offset: number = 0,
  ): Promise<MoneyFlowRow[]> {
    try {
      const tokenHistory: MoneyFlowRow[] = [];
      const maxIndex = await this.redisService.getAsJson<number>(
        `token-history:${asset}:mf:length`,
      );
      for (
        let index = offset + 1;
        index <= limit + offset && index <= maxIndex;
        index++
      ) {
        const element = await this.redisService.getAsJson<MoneyFlowRow>(
          `token-history:${asset}:mf:${index}`,
        );

        tokenHistory.push(element);
      }

      return tokenHistory;
    } catch (error) {
      this.logger.error(
        `Failed to get token history for asset ${asset}:`,
        error,
      );
      throw error;
    }
  }

  async getTokenSummary(asset: string): Promise<TokenSummary | null> {
    try {
      const tokenSummary = await this.redisService.getAsJson<TokenSummary>(
        `token:${asset}`,
      );

      return tokenSummary || null;
    } catch (error) {
      this.logger.error(
        `Failed to get token summary for asset ${asset}:`,
        error,
      );
      throw error;
    }
  }

  async getAllTokens(): Promise<string[]> {
    try {
      return await this.clickhouseService.getAllTokens();
    } catch (error) {
      this.logger.error('Failed to get all tokens:', error);
      throw error;
    }
  }

  async getTopVolumeTokens(): Promise<any[]> {
    try {
      const topTokens: any[] = [];

      for (let index = 1; index <= 100; index++) {
        const tokenData = await this.redisService.getAsJson<any>(
          `top-token-last-day:${index}`,
        );
        if (tokenData) {
          topTokens.push(tokenData);
        }
      }

      return topTokens.sort((a, b) => (a.top || 0) - (b.top || 0));
    } catch (error) {
      this.logger.error('Failed to get top volume tokens:', error);
      throw error;
    }
  }

  async getChartsByToken(token: string) {
    try {
      const volumesOneHour = await this.redisService.getAsJson(
        `chart:${token}:volume:1-hour`,
      );
      const volumesOneDay = await this.redisService.getAsJson(
        `chart:${token}:volume:1-day`,
      );
      const volumesSevenDay = await this.redisService.getAsJson(
        `chart:${token}:volume:7-day`,
      );
      const volumesThirtyDay = await this.redisService.getAsJson(
        `chart:${token}:volume:30-day`,
      );

      const holdersOneHour = await this.redisService.getAsJson(
        `chart:${token}:holders:1-hour`,
      );
      const holdersOneDay = await this.redisService.getAsJson(
        `chart:${token}:holders:1-day`,
      );
      const holdersSevenDay = await this.redisService.getAsJson(
        `chart:${token}:holders:7-day`,
      );
      const holdersThirtyDay = await this.redisService.getAsJson(
        `chart:${token}:holders:30-day`,
      );

      const tradersOneHour = await this.redisService.getAsJson(
        `chart:${token}:traders:1-hour`,
      );
      const tradersOneDay = await this.redisService.getAsJson(
        `chart:${token}:traders:1-day`,
      );
      const tradersSevenDay = await this.redisService.getAsJson(
        `chart:${token}:traders:7-day`,
      );
      const tradersThirtyDay = await this.redisService.getAsJson(
        `chart:${token}:traders:30-day`,
      );

      return {
        volume: {
          oneHour: volumesOneHour,
          oneDay: volumesOneDay,
          sevenDay: volumesSevenDay,
          thirtyDay: volumesThirtyDay,
        },
        holders: {
          oneHour: holdersOneHour,
          oneDay: holdersOneDay,
          sevenDay: holdersSevenDay,
          thirtyDay: holdersThirtyDay,
        },
        traders: {
          oneHour: tradersOneHour,
          oneDay: tradersOneDay,
          sevenDay: tradersSevenDay,
          thirtyDay: tradersThirtyDay,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get charts:', error);
      throw error;
    }
  }

  async getTopPNLAccounts(): Promise<SmartMoneySummary[]> {
    try {
      const topAccounts: SmartMoneySummary[] = [];

      for (let i = 0; i <= 100; i++) {
        const accountData =
          await this.redisService.getAsJson<SmartMoneySummary>(`top:${i}`);
        if (accountData) {
          topAccounts.push(accountData);
        }
      }

      return topAccounts.sort((a, b) => (b.totalPnl || 0) - (a.totalPnl || 0));
    } catch (error) {
      this.logger.error('Failed to get top PNL accounts:', error);
      throw error;
    }
  }
}
