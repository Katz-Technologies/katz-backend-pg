import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import pLimit from 'p-limit';
import { IAppConfig, IClickhouseConfig } from '../config/config.interface';
import type { RedisService } from '../redis/redis.service';
import { Inject } from '@nestjs/common';
import { REDIS_TOKENS } from '../redis/redis.tokens';
import { AccountFlowCount } from 'src/service/smart_money/interface/account-flow-count.interface';
import { MoneyFlowRow } from 'src/service/smart_money/interface/money-flow-row.interface';
import { RedisExportData } from 'src/service/smart_money/interface/redis-export-data.interface';
import { XrpPriceData } from 'src/service/smart_money/interface/xrp-price-data.interface';
import { SmartMoneySummary } from 'src/service/smart_money/type/smart-money-summary.type';
import { TokensSummary } from 'src/service/smart_money/type/tokens-summary.type';
import { ETag } from 'src/service/smart_money/enum/tag.type';
import { ExcludedTags } from 'src/service/smart_money/const/excluded-tags.const';
import { RequiredTags } from 'src/service/smart_money/const/required-tags.const';
import { TokenVolumeCharts } from 'src/service/smart_money/type/token-summary.type';
import {
  TokenTradersCharts,
  TokenHoldersCharts,
} from 'src/domain/chart/chart.domain';
import { BalanceData } from 'src/service/smart_money/type/balance-data.type';
import { DateTime } from 'luxon';

const TWO_HOURS = 2 * 60 * 60;

@Injectable()
export class ClickhouseService {
  private readonly logger = new Logger(ClickhouseService.name);
  private clickHouseClient: ClickHouseClient;

  /**
   * Парсит closeTime из строки в DateTime (UTC)
   * Формат ClickHouse: 2025-11-24 11:15:12.000
   */
  private parseCloseTime(closeTime: string | Date | DateTime): DateTime {
    if (closeTime instanceof DateTime) {
      return closeTime;
    }

    if (closeTime instanceof Date) {
      return DateTime.fromJSDate(closeTime, { zone: 'utc' });
    }

    // Сначала пробуем формат ClickHouse: yyyy-MM-dd HH:mm:ss.SSS
    let dateTime = DateTime.fromFormat(closeTime, 'yyyy-MM-dd HH:mm:ss.SSS', {
      zone: 'utc',
    });
    if (!dateTime.isValid) {
      // Пробуем без миллисекунд: yyyy-MM-dd HH:mm:ss
      dateTime = DateTime.fromFormat(closeTime, 'yyyy-MM-dd HH:mm:ss', {
        zone: 'utc',
      });
    }
    if (!dateTime.isValid) {
      // Пробуем SQL формат
      dateTime = DateTime.fromSQL(closeTime, { zone: 'utc' });
    }
    if (!dateTime.isValid) {
      // Пробуем ISO формат
      dateTime = DateTime.fromISO(closeTime, { zone: 'utc' });
    }
    if (!dateTime.isValid) {
      // Fallback: используем стандартный Date
      dateTime = DateTime.fromJSDate(new Date(closeTime), { zone: 'utc' });
    }

    return dateTime;
  }

  constructor(
    private readonly configService: ConfigService<IAppConfig>,
    @Inject(REDIS_TOKENS.EXTERNAL)
    private readonly redisService: RedisService,
  ) {
    const clickhouseConfig =
      this.configService.getOrThrow<IClickhouseConfig>('clickhouse');

    this.clickHouseClient = createClient({
      url: clickhouseConfig.host,
      username: clickhouseConfig.username,
      password: clickhouseConfig.password,
      database: clickhouseConfig.database,
      request_timeout: clickhouseConfig.requestTimeout || 600000,
      max_open_connections: clickhouseConfig.maxOpenConnections || 10,
      keep_alive: {
        enabled: clickhouseConfig.keepAlive !== false,
      },
      compression: {
        response: clickhouseConfig.compression !== false,
        request: clickhouseConfig.compression !== false,
      },
    });
  }

  async getAllTokens(): Promise<any> {
    const result: any[] = await this.executeQuery(`
    SELECT DISTINCT asset
      FROM (
      SELECT concat(from_currency, '.', from_issuer_address) AS asset FROM xrpl.money_flow
      UNION ALL
      SELECT concat(to_currency, '.', to_issuer_address) AS asset FROM xrpl.money_flow
    )`);
    return result.map((item: any) => item.asset);
  }

  async insertXrpPrices(prices: XrpPriceData[]): Promise<void> {
    try {
      const values = prices.map((price) => ({
        timestamp: price.timestamp
          .toISOString()
          .replace('T', ' ')
          .replace('Z', ''),
        price_usd: price.price_usd.toString(),
      }));

      await this.clickHouseClient.insert({
        table: 'xrp_prices',
        values,
        format: 'JSONEachRow',
      });

      await this.clickHouseClient.query({
        query: 'OPTIMIZE TABLE xrpl.xrp_prices FINAL;',
      });
    } catch (error) {
      this.logger.error('Failed to insert XRP prices', error);
      throw error;
    }
  }

  async executeQuery<T>(query: string): Promise<T> {
    try {
      const result = await this.clickHouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      return (await result.json()) as T;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      const errorStack =
        error instanceof Error ? error.stack : 'No stack trace available';
      this.logger.error(`Failed to execute query: ${errorMessage}`, errorStack);
      this.logger.error('Query that failed:', {
        query: query.substring(0, 500), // Log first 500 chars of query
        error: errorMessage,
        stack: errorStack,
      });

      // this.logger.error('Failed to execute query', error);
      throw error;
    }
  }

  async getTopByMoneyFlow(
    limit: number,
    kinds: string[],
  ): Promise<AccountFlowCount[]> {
    try {
      let kindFilter = '';
      if (kinds && kinds.length > 0) {
        const kindsList = kinds.map((k) => `'${k}'`).join(', ');
        kindFilter = `WHERE kind IN (${kindsList})`;
      }

      const baseQuery = `
          SELECT
              mf.from_address as address,
              COUNT(*) AS flows
          FROM xrpl.money_flow AS mf
          ${kindFilter}
          -- AND (close_time >= (now64(3, 'UTC') - INTERVAL 1 MONTH)
          -- AND close_time < now64(3, 'UTC'))
          GROUP BY address
          HAVING flows > 0 AND flows <= 10000
          ORDER BY flows DESC
      LIMIT ${limit};
    `;

      const result = await this.executeQuery<AccountFlowCount[]>(baseQuery);
      return result;
    } catch (error) {
      this.logger.error('Failed to get top users by money flow', error);
      throw error;
    }
  }

  async getMoneyFlowData(
    kinds?: string[],
    addresses?: string[],
  ): Promise<MoneyFlowRow[]> {
    try {
      const hasKinds = kinds && kinds.length > 0;
      const hasAddresses = addresses && addresses.length > 0;

      if (!hasKinds && !hasAddresses) {
        this.logger.warn(
          'getMoneyFlowData called without both kinds and addresses parameters',
        );
        return [];
      }

      let kindFilter = '';
      if (hasKinds) {
        const kindList = kinds!.map((k) => `'${k}'`).join(', ');
        kindFilter = `kind IN (${kindList})`;
      }

      let addressFilter = '';
      if (hasAddresses) {
        const addressList = addresses!.map((a) => `'${a}'`).join(',');
        addressFilter = `(from_address IN (${addressList}) OR to_address IN (${addressList}))`;
      }

      const whereCondition =
        kindFilter && addressFilter
          ? `${kindFilter} AND ${addressFilter}`
          : kindFilter || addressFilter;

      let accountFlowsCTE = '';
      let accountFlowsFilter = '';

      if (hasKinds && !hasAddresses) {
        accountFlowsCTE = `,
          account_flows AS (
            SELECT
                address AS account_address,
                countIf(kind != 'fee') AS unique_tx_count
            FROM
            (
                SELECT from_address AS address, kind
                FROM xrpl.money_flow

                UNION ALL

                SELECT to_address AS address, kind
                FROM xrpl.money_flow
            )
            GROUP BY address
            HAVING unique_tx_count > 0
              AND unique_tx_count < 10000
              AND countIf(kind = 'transfer') < 1000
          )`;

        accountFlowsFilter = `AND (from_address IN (SELECT account_address FROM account_flows)
              OR to_address IN (SELECT account_address FROM account_flows))`;
      }

      const query = `
        WITH
          prices_1m AS (
            SELECT toStartOfMinute(timestamp) AS ts_min, any(price_usd) AS price_usd
            FROM xrpl.xrp_prices
            GROUP BY ts_min
          )${accountFlowsCTE}
        SELECT
          from_address,
          to_address,
          concat(from_currency, '.', from_issuer_address) AS from_asset,
          concat(to_currency, '.', to_issuer_address) AS to_asset,
          from_amount,
          to_amount,
          init_from_amount,
          init_to_amount,
          p.price_usd,
          kind,
          close_time,
          ledger_index,
          in_ledger_index,
          tx_hash
        FROM xrpl.money_flow
        LEFT JOIN prices_1m AS p ON p.ts_min = toStartOfMinute(close_time)
        WHERE ${whereCondition}
          ${accountFlowsFilter}
          --AND (close_time < parseDateTimeBestEffort('2025-11-05T06:00:00Z', 3, 'UTC') AND close_time > parseDateTimeBestEffort('2025-10-05T06:00:00Z', 3, 'UTC'))
        ORDER BY ledger_index, in_ledger_index;
      `;

      const result = await this.executeQuery<MoneyFlowRow[]>(query);

      return result;
    } catch (error) {
      this.logger.error('Failed to get money flow data', error);
      throw error;
    }
  }

  async setAccountHistoryToRedis(
    data: RedisExportData,
    expire: number = TWO_HOURS,
  ): Promise<void> {
    const limit = pLimit(100);

    for (const [fromId, records] of Object.entries(data)) {
      if (fromId === '') continue;
      const key = `history:${fromId}:mf:length`;
      await this.redisService.setAsJsonEx(key, records.length, expire);

      const tasks = records.map((v, index) =>
        limit(async () => {
          const reverseSerialNumber = records.length - index;
          const key = `history:${fromId}:mf:${reverseSerialNumber}`;
          await this.redisService.setAsJsonEx(key, v, expire);
        }),
      );

      await Promise.all(tasks);
    }
  }

  async setTokenHistoryToRedis(
    data: RedisExportData,
    expire: number = TWO_HOURS,
  ): Promise<void> {
    const limit = pLimit(100);
    for (const [asset, records] of Object.entries(data)) {
      if (asset === '') continue;
      const key = `token-history:${asset}:mf:length`;
      await this.redisService.setAsJsonEx(key, records.length, expire);

      const tasks = records.map((v, index) =>
        limit(async () => {
          const reverseSerialNumber = records.length - index;
          const key = `token-history:${asset}:mf:${reverseSerialNumber}`;
          await this.redisService.setAsJsonEx(key, v, expire);
        }),
      );

      await Promise.all(tasks);
    }
  }

  async setBalancesToRedis(
    smartMoneySummaries: SmartMoneySummary[],
  ): Promise<void> {
    const CHUNK_SIZE = 500;
    const TOP_SIZE = 100;
    let topAddedCount = 0;
    const balanceKeysSet = new Set<string>();

    for (let i = 0; i < smartMoneySummaries.length; i += CHUNK_SIZE) {
      const chunk = smartMoneySummaries.slice(i, i + CHUNK_SIZE);
      const pipeline = this.redisService.pipelineWithJson();

      for (
        let sortedResultIndex = 0;
        sortedResultIndex < chunk.length;
        sortedResultIndex++
      ) {
        const sortedResult = chunk[sortedResultIndex];
        const reversedSales = [...(sortedResult?.sales ?? [])].reverse();

        const hasAllRequired = RequiredTags.every((tag: ETag) =>
          sortedResult?.tags.includes(tag),
        );
        const hasExcluded = ExcludedTags.some((tag: ETag) =>
          sortedResult?.tags.includes(tag),
        );

        const limitedResult = {
          ...(sortedResult ?? {}),
          sales: reversedSales.slice(0, 100),
          tags: sortedResult?.tags ?? [],
        };

        if (topAddedCount < TOP_SIZE && hasAllRequired && !hasExcluded) {
          topAddedCount++;
          const summaryKey = `top:${topAddedCount}`;
          pipeline.setAsJsonEx(summaryKey, limitedResult, 2 * 60 * 60);
        }

        const userSummaryKey = `summary:${sortedResult?.address ?? ''}`;
        const summaryData = { ...sortedResult, sales: undefined };

        Object.entries(summaryData?.balances ?? {}).forEach(
          ([assetId, balances]) => {
            const balanceKey =
              'balance:' + summaryData?.address + ':' + assetId;
            balanceKeysSet.add(balanceKey);

            // Преобразуем DateTime в строку для сериализации в Redis
            // Формат: yyyy-MM-dd HH:mm:ss.SSS (как в ClickHouse)
            const serializedBalances = balances.map((b) => ({
              balance: b.balance,
              closeTime:
                b.closeTime instanceof DateTime
                  ? b.closeTime.toFormat('yyyy-MM-dd HH:mm:ss.SSS')
                  : b.closeTime,
              inLedgerIndex: b.inLedgerIndex,
            }));

            pipeline.setAsJsonEx(balanceKey, serializedBalances, 2 * 60 * 60);
          },
        );

        pipeline.setAsJsonEx(
          userSummaryKey + ':sale:length',
          reversedSales.length,
          2 * 60 * 60,
        );

        for (let index = 0; index < reversedSales.length; index++) {
          const saleIndex = index + 1;
          pipeline.setAsJsonEx(
            userSummaryKey + ':sale:' + saleIndex,
            reversedSales[index],
            2 * 60 * 60,
          );
        }
      }

      await pipeline.exec();
    }

    let existingKeys: string[] = [];
    try {
      const keysFromRedis =
        await this.redisService.getAsJson<string[]>('balances:keys');
      // Проверяем, что получили массив
      if (Array.isArray(keysFromRedis)) {
        existingKeys = keysFromRedis;
      }
    } catch {
      // Если ключ не существует, это нормально для первого запуска
    }

    // Объединяем существующие и новые ключи
    const allBalanceKeys = Array.from(
      new Set([...existingKeys, ...Array.from(balanceKeysSet)]),
    );

    // Сохраняем обновленный список всех ключей балансов для быстрого доступа
    await this.redisService.setAsJsonEx(
      'balances:keys',
      allBalanceKeys,
      2 * 60 * 60,
    );
  }

  async getNewTokens(): Promise<any[]> {
    return this.executeQuery(`
      select * from new_tokens
        order by first_seen_ledger_index desc,
        first_seen_in_ledger_index desc
        limit 100`);
  }

  async setTokensSummariesToRedis(data: {
    allTime: TokensSummary;
    lastDay: TokensSummary;
  }): Promise<void> {
    const { allTime: tokensSummaries, lastDay: tokensSummariesLastDay } = data;
    const pipeline = this.redisService.pipelineWithJson();

    let sortedTokens = Object.entries(tokensSummaries).sort(
      (a, b) => b[1].holders.length - a[1].holders.length,
    );

    sortedTokens = sortedTokens.filter(
      ([tokenAsset]) => tokenAsset !== 'XRP.XRP',
    );

    for (const [tokenAsset, tokenSummary] of Object.entries(tokensSummaries)) {
      const tokenKey = `token:${tokenAsset}`;
      pipeline.setAsJsonEx(tokenKey, tokenSummary, TWO_HOURS);
    }

    const topTokens = sortedTokens.slice(0, 100);
    for (let i = 0; i < topTokens.length; i++) {
      const [tokenAsset, tokenSummary] = topTokens[i];
      const topTokenKey = `top-token:${i + 1}`;
      pipeline.setAsJsonEx(
        topTokenKey,
        {
          top: i + 1,
          token: tokenAsset,
          ...tokenSummary,
        },
        TWO_HOURS,
      );
    }

    const sortedTokensLastDay = Object.entries(tokensSummariesLastDay).sort(
      (a, b) => b[1].volume.totalVolume - a[1].volume.totalVolume,
    );

    for (const [tokenAsset, tokenSummary] of Object.entries(
      tokensSummariesLastDay,
    )) {
      const tokenKey = `token-last-day:${tokenAsset}`;
      pipeline.setAsJsonEx(tokenKey, tokenSummary, TWO_HOURS);
    }

    const topTokensLastDay = sortedTokensLastDay.slice(0, 100);
    for (let i = 0; i < topTokensLastDay.length; i++) {
      const [tokenAsset, tokenSummary] = topTokensLastDay[i];
      const topTokenKey = `top-token-last-day:${i + 1}`;
      pipeline.setAsJsonEx(
        topTokenKey,
        {
          top: i + 1,
          token: tokenAsset,
          ...tokenSummary,
        },
        TWO_HOURS,
      );
    }

    await pipeline.exec();
  }

  async setTokenVolumeChartsToRedis(
    tokensVolumeCharts: Record<string, TokenVolumeCharts>,
  ): Promise<void> {
    const pipeline = this.redisService.pipelineWithJson();

    for (const [tokenAsset, charts] of Object.entries(tokensVolumeCharts)) {
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:volume:1-hour`,
        charts.hour,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:volume:1-day`,
        charts.day,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:volume:7-day`,
        charts.week,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:volume:30-day`,
        charts.month,
        TWO_HOURS,
      );
    }

    await pipeline.exec();
  }

  async setTokenTradersChartsToRedis(
    tokensTradersCharts: Record<string, TokenTradersCharts>,
  ): Promise<void> {
    const pipeline = this.redisService.pipelineWithJson();

    for (const [tokenAsset, charts] of Object.entries(tokensTradersCharts)) {
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:traders:1-hour`,
        charts.hour,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:traders:1-day`,
        charts.day,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:traders:7-day`,
        charts.week,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:traders:30-day`,
        charts.month,
        TWO_HOURS,
      );
    }

    await pipeline.exec();
  }

  async setTokenHoldersChartsToRedis(
    tokensHoldersCharts: Record<string, TokenHoldersCharts>,
  ): Promise<void> {
    const pipeline = this.redisService.pipelineWithJson();

    for (const [tokenAsset, charts] of Object.entries(tokensHoldersCharts)) {
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:holders:1-hour`,
        charts.hour,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:holders:1-day`,
        charts.day,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:holders:7-day`,
        charts.week,
        TWO_HOURS,
      );
      pipeline.setAsJsonEx(
        `chart:${tokenAsset}:holders:30-day`,
        charts.month,
        TWO_HOURS,
      );
    }

    await pipeline.exec();
  }

  /**
   * Получает все балансы из Redis и преобразует их в формат для построения графиков холдеров
   * Формат: Record<token, Record<address, BalanceData[]>>
   */
  async getBalancesFromRedis(): Promise<
    Record<string, Record<string, BalanceData[]>>
  > {
    // Сначала пытаемся получить список ключей из индекса

    const balanceKeys =
      await this.redisService.getAsJson<string[]>('balances:keys');

    if (!balanceKeys || balanceKeys.length === 0) {
      return {};
    }

    const tokenBalances: Record<string, Record<string, BalanceData[]>> = {};

    const limit = pLimit(100);

    const tasks = balanceKeys.map((key) =>
      limit(async () => {
        try {
          const parts = key.split(':');
          if (parts.length < 3) return;

          const address = parts[1];
          const assetId = parts.slice(2).join(':'); // На случай, если assetId содержит ':'

          const balancesRaw = await this.redisService.getAsJson<any[]>(key);

          if (!balancesRaw || balancesRaw.length === 0) return;

          // Нормализуем балансы: преобразуем closeTime из строки в DateTime
          const balances: BalanceData[] = balancesRaw
            .map((b) => {
              const closeTime = this.parseCloseTime(b.closeTime);

              // Проверяем валидность
              if (!closeTime.isValid) {
                this.logger.warn(
                  `Invalid closeTime in balance from Redis key ${key}:`,
                  b.closeTime,
                );
                return null;
              }

              return {
                balance: b.balance,
                closeTime,
                inLedgerIndex: b.inLedgerIndex,
              };
            })
            .filter((b): b is BalanceData => b !== null);

          if (!tokenBalances[assetId]) {
            tokenBalances[assetId] = {};
          }

          // Объединяем с существующими балансами, если они есть
          if (tokenBalances[assetId][address]) {
            tokenBalances[assetId][address] = [
              ...tokenBalances[assetId][address],
              ...balances,
            ];
          } else {
            tokenBalances[assetId][address] = balances;
          }
        } catch (error) {
          this.logger.warn(
            `Failed to get balance from Redis key ${key}:`,
            error,
          );
        }
      }),
    );

    await Promise.all(tasks);

    return tokenBalances;
  }

  async close(): Promise<void> {
    await this.clickHouseClient.close();
  }
}
