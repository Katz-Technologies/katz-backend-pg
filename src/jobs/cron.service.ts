import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokensService } from '../services/tokens/tokens.service';
import { IconsService } from '../services/icons/icons.service';
import { IconsCacheService } from '../services/icons/icons-cache.service';
import { ETopType } from './enum/top-types.enum';
import { ALL_TOP_TYPES } from './utils/top-mapping';
import { ClickhouseService } from '../common/clickhouse/clickhouse.service';
import { NewTokenService } from '../services/new-token/new-token.service';

@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);

  private readonly BATCH_SIZE = 100;
  private readonly REQUEST_TIMEOUT = 20;

  constructor(
    private readonly tokensService: TokensService,
    private readonly iconsService: IconsService,
    private readonly iconsCacheService: IconsCacheService,
    private readonly clickhouseService: ClickhouseService,
    private readonly newTokenService: NewTokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.iconsCacheService.waitUntilReady();
    await this.loadFallbackTokenIcon();
    await this.handleTopTokensCron();
    // await this.handleNewTokensCron();

    setImmediate(() => {
      Promise.all([
        this.handleTokenIconsCron(),
        this.handleAccountIconsCron(),
      ]).catch((error) => {
        this.logger.error('Error in parallel cron jobs:', error);
      });
    });
  }

  async loadFallbackTokenIcon(): Promise<void> {
    this.logger.log('Loading fallback token icon to cache...');
    try {
      const fallbackIcon =
        await this.iconsService.loadFallbackTokenIconFromFile();
      if (fallbackIcon.length > 0) {
        await this.iconsCacheService.saveFallbackTokenIcon(fallbackIcon);
        this.logger.log('Fallback token icon loaded to cache successfully');
      } else {
        this.logger.warn('Fallback token icon is empty, skipping cache');
      }
    } catch (error) {
      this.logger.error('Error loading fallback token icon to cache:', error);
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async handleNewTokensCron() {
  //   this.logger.log(
  //     'New tokens cron job executed at: ' + new Date().toISOString(),
  //   );

  //   try {
  //     const tokens = await this.clickhouseService.getNewTokens();
  //     this.logger.log(`Tokens count: ${tokens.length}`);

  //     if (tokens.length > 0) {
  //       await this.newTokenService.saveNewTokens(tokens);
  //     } else {
  //       this.logger.warn('[NEW TOKENS] No tokens to save to Redis');
  //     }
  //   } catch (error) {
  //     this.logger.error('Error in handleNewTokensCron:', error);
  //   }
  // }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTopTokensCron(): Promise<void> {
    this.logger.log(
      'Top tokens cron job executed at: ' + new Date().toISOString(),
    );

    try {
      const DELAY_BETWEEN_REQUESTS = 5000;

      for (let i = 0; i < ALL_TOP_TYPES.length; i++) {
        const topType = ALL_TOP_TYPES[i];
        if (!topType) continue;

        try {
          await this.processTopTypeTokens(topType);
        } catch (error) {
          this.logger.error(
            `[${topType}] Error in handleTopTokensCron:`,
            error,
          );
        }

        if (i < ALL_TOP_TYPES.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_REQUESTS),
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in handleTopTokensCron:', error);
    }
  }

  private async processTopTypeTokens(topType: ETopType): Promise<void> {
    const tokens = await this.tokensService.getTopTokensList(topType);
    this.logger.log(`[${topType}] Tokens count: ${tokens.length}`);

    if (tokens.length > 0) {
      await this.iconsCacheService.saveTopTokens(topType, tokens);

      if (topType === ETopType.TRENDING) {
        await this.iconsCacheService.saveTopTokensForTrending(tokens);
      }
    } else {
      this.logger.warn(`[${topType}] No tokens to save to Redis`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleTokenIconsCron(): Promise<void> {
    this.logger.log(
      'Getting token icons cron job executed at: ' + new Date().toISOString(),
    );

    try {
      let tokensList = await this.iconsCacheService.getTokensList();

      if (tokensList.length === 0) {
        const allTopTokens = await this.iconsCacheService.getAllTopTokens();
        const uniqueTokensMap = new Map<
          string,
          { currency: string; issuer: string }
        >();

        Object.values(allTopTokens).forEach((tokens) => {
          tokens.forEach((token) => {
            const key = `${token.currency}:${token.issuer}`;
            if (!uniqueTokensMap.has(key)) {
              uniqueTokensMap.set(key, {
                currency: token.currency,
                issuer: token.issuer,
              });
            }
          });
        });

        tokensList = Array.from(uniqueTokensMap.values());
        this.logger.log(
          `Collected ${tokensList.length} unique tokens from all top types`,
        );
      }

      const allTopTokens = await this.iconsCacheService.getAllTopTokens();
      const allTokensFlat = Object.values(allTopTokens).flat();

      const totalTokens = tokensList.length;
      this.logger.log(`Total tokens to process: ${totalTokens}`);

      for (let i = 0; i < tokensList.length; i += this.BATCH_SIZE) {
        const batchStartTime = Date.now();
        const batch = tokensList.slice(i, i + this.BATCH_SIZE);
        const batchStart = i + 1;
        const batchEnd = Math.min(i + batch.length, totalTokens);

        const batchPromises = batch.map(async (token) => {
          await this.iconsCacheService.getTokenIconWithFallback(
            token.currency,
            token.issuer,
            allTokensFlat,
          );
        });

        await Promise.all(batchPromises);

        const batchEndTime = Date.now();
        const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(
          2,
        );
        const processedCount = Math.min(i + batch.length, totalTokens);

        this.logger.log(
          `Processed ${processedCount}/${totalTokens} icons (${batchStart}-${batchEnd}): ${batchDuration}s`,
        );

        if (i + this.BATCH_SIZE < tokensList.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.REQUEST_TIMEOUT),
          );
        }
      }

      this.logger.log(`Completed processing ${totalTokens} token icons`);
    } catch (error) {
      this.logger.error('Error in handleTokenIconsCron:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleAccountIconsCron(): Promise<void> {
    this.logger.log(
      'Getting account icons cron job executed at: ' + new Date().toISOString(),
    );

    try {
      const accountsList = await this.iconsCacheService.getAccountsList();
      if (accountsList.length === 0) {
        return;
      }

      const totalAccounts = accountsList.length;
      this.logger.log(`Total accounts to process: ${totalAccounts}`);

      for (let i = 0; i < accountsList.length; i += this.BATCH_SIZE) {
        const batchStartTime = Date.now();
        const batch = accountsList.slice(i, i + this.BATCH_SIZE);
        const batchStart = i + 1;
        const batchEnd = Math.min(i + batch.length, totalAccounts);

        const batchPromises = batch.map(async (account) => {
          const icon = await this.iconsService.getAccountIcon(account);
          await this.iconsCacheService.saveAccountIcon(account, icon);
        });

        await Promise.all(batchPromises);

        const batchEndTime = Date.now();
        const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(
          2,
        );
        const processedCount = Math.min(i + batch.length, totalAccounts);

        this.logger.log(
          `Processed ${processedCount}/${totalAccounts} icons (${batchStart}-${batchEnd}): ${batchDuration}s`,
        );

        if (i + this.BATCH_SIZE < accountsList.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.REQUEST_TIMEOUT),
          );
        }
      }

      this.logger.log(`Completed processing ${totalAccounts} account icons`);
    } catch (error) {
      this.logger.error('Error in handleAccountIconsCron:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleFallbackIconRefreshCron(): Promise<void> {
    this.logger.log(
      'Refreshing fallback token icon cache at: ' + new Date().toISOString(),
    );

    try {
      await this.loadFallbackTokenIcon();
    } catch (error) {
      this.logger.error('Error in handleFallbackIconRefreshCron:', error);
    }
  }
}
